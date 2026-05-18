package com.church.church_backend.controller;

import java.util.List;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.church.church_backend.model.ChurchService;
import com.church.church_backend.repository.ChurchServiceRepository;
import com.church.church_backend.security.JwtUtil;

@RestController
@RequestMapping("/services")
public class ChurchServiceController {

    private final ChurchServiceRepository serviceRepository;
    private final JwtUtil jwtUtil;

    public ChurchServiceController(ChurchServiceRepository serviceRepository, JwtUtil jwtUtil) {
        this.serviceRepository = serviceRepository;
        this.jwtUtil = jwtUtil;
    }

    // Create — tag to logged-in user
    @PostMapping("/create")
    public ResponseEntity<ChurchService> createService(
            @RequestBody ChurchService service,
            HttpServletRequest request) {
        String email = getEmailFromToken(request);
        service.setCreatedBy(email);
        return ResponseEntity.ok(serviceRepository.save(service));
    }

    // Get all — ADMIN sees everything, USER sees only theirs
    @GetMapping
    public ResponseEntity<List<ChurchService>> getAllServices(HttpServletRequest request) {
        String email = getEmailFromToken(request);
        String role = getRoleFromToken(request);

        List<ChurchService> services = role.equals("ADMIN")
                ? serviceRepository.findAll()
                : serviceRepository.findByCreatedBy(email);

        return ResponseEntity.ok(services);
    }

    // Get by ID — only if it belongs to this user (or admin)
    @GetMapping("/{id}")
    public ResponseEntity<ChurchService> getServiceById(
            @PathVariable Long id,
            HttpServletRequest request) {
        String email = getEmailFromToken(request);
        String role = getRoleFromToken(request);

        if (role.equals("ADMIN")) {
            return serviceRepository.findById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }

        return serviceRepository.findByIdAndCreatedBy(id, email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update — only if it belongs to this user (or admin)
    @PutMapping("/update/{id}")
    public ResponseEntity<ChurchService> updateService(
            @PathVariable Long id,
            @RequestBody ChurchService updatedService,
            HttpServletRequest request) {
        String email = getEmailFromToken(request);
        String role = getRoleFromToken(request);

        var existing = role.equals("ADMIN")
                ? serviceRepository.findById(id)
                : serviceRepository.findByIdAndCreatedBy(id, email);

        return existing.map(s -> {
            s.setTitle(updatedService.getTitle());
            s.setDescription(updatedService.getDescription());
            s.setLocation(updatedService.getLocation());
            s.setStartTime(updatedService.getStartTime());
            s.setEndTime(updatedService.getEndTime());
            s.setPreacher(updatedService.getPreacher());
            s.setLivestreamAvailable(updatedService.isLivestreamAvailable());
            return ResponseEntity.ok(serviceRepository.save(s));
        }).orElse(ResponseEntity.notFound().build());
    }

    // Delete — only if it belongs to this user (or admin)
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteService(
            @PathVariable Long id,
            HttpServletRequest request) {
        String email = getEmailFromToken(request);
        String role = getRoleFromToken(request);

        var existing = role.equals("ADMIN")
                ? serviceRepository.findById(id)
                : serviceRepository.findByIdAndCreatedBy(id, email);

        return existing.map(s -> {
            serviceRepository.delete(s);
            return ResponseEntity.ok("Church service deleted successfully");
        }).orElse(ResponseEntity.notFound().build());
    }

    // ── Helpers ──
    private String getEmailFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return jwtUtil.extractUsername(authHeader.substring(7));
    }

    private String getRoleFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return "USER";
        return jwtUtil.extractRole(authHeader.substring(7));
    }
}