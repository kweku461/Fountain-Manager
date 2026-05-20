package com.church.church_backend.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.church.church_backend.model.Church;
import com.church.church_backend.repository.ChurchRepository;
import com.church.church_backend.security.JwtUtil;

@RestController
@RequestMapping("/api/church")
public class ChurchController {

    private final ChurchRepository churchRepository;
    private final JwtUtil jwtUtil;

    public ChurchController(ChurchRepository churchRepository, JwtUtil jwtUtil) {
        this.churchRepository = churchRepository;
        this.jwtUtil = jwtUtil;
    }

    // ── GET /api/church ──
    @GetMapping
    public ResponseEntity<?> getChurchInfo(HttpServletRequest request) {
        String email = getEmailFromToken(request);

        return churchRepository.findByCreatedBy(email)
                .map(church -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("churchName",      church.getChurchName()  != null ? church.getChurchName()  : "");
                    result.put("address",         church.getAddress()     != null ? church.getAddress()     : "");
                    result.put("serviceDay",      church.getServiceDay()  != null ? church.getServiceDay()  : "Sunday");
                    result.put("serviceTime",     church.getServiceTime() != null ? church.getServiceTime() : "09:00");
                    result.put("firstTimerAlert", church.isFirstTimerAlert());
                    result.put("alertEmails",     parseAlertEmails(church.getAlertEmails()));
                    return ResponseEntity.ok(result);
                })
                .orElseGet(() -> {
                    // No church info yet for this user — return empty defaults
                    Map<String, Object> defaults = new HashMap<>();
                    defaults.put("churchName",      "");
                    defaults.put("address",         "");
                    defaults.put("serviceDay",      "Sunday");
                    defaults.put("serviceTime",     "09:00");
                    defaults.put("firstTimerAlert", true);
                    defaults.put("alertEmails",     List.of());
                    return ResponseEntity.ok(defaults);
                });
    }

    // ── PUT /api/church ──
    @PutMapping
    public ResponseEntity<?> updateChurchInfo(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        try {
            String email = getEmailFromToken(request);

            // Find existing church for this user or create a new one
            Church church = churchRepository.findByCreatedBy(email)
                    .orElse(new Church());

            // Tag to this user if new
            if (church.getCreatedBy() == null) {
                church.setCreatedBy(email);
            }

            String churchName = (String) body.get("churchName");
            if (churchName == null || churchName.isBlank()) {
                churchName = church.getChurchName();
            }
            if (churchName == null || churchName.isBlank()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Church name is required"));
            }

            church.setChurchName(churchName);
            church.setAddress((String) body.getOrDefault("address",     church.getAddress()     != null ? church.getAddress()     : ""));
            church.setServiceDay((String) body.getOrDefault("serviceDay",  church.getServiceDay()  != null ? church.getServiceDay()  : "Sunday"));
            church.setServiceTime((String) body.getOrDefault("serviceTime", church.getServiceTime() != null ? church.getServiceTime() : "09:00"));

            Object alertVal = body.get("firstTimerAlert");
            if (alertVal instanceof Boolean) {
                church.setFirstTimerAlert((Boolean) alertVal);
            }

            Object emailsVal = body.get("alertEmails");
            if (emailsVal instanceof List<?> emailList) {
                String joined = emailList.stream()
                        .filter(e -> e instanceof String && !((String) e).isBlank())
                        .limit(3)
                        .map(Object::toString)
                        .collect(Collectors.joining(","));
                church.setAlertEmails(joined.isBlank() ? null : joined);
            }

            churchRepository.save(church);

            Map<String, Object> response = new HashMap<>();
            response.put("message",         "Church info updated successfully");
            response.put("churchName",      church.getChurchName());
            response.put("address",         church.getAddress()     != null ? church.getAddress()     : "");
            response.put("serviceDay",      church.getServiceDay()  != null ? church.getServiceDay()  : "Sunday");
            response.put("serviceTime",     church.getServiceTime() != null ? church.getServiceTime() : "09:00");
            response.put("firstTimerAlert", church.isFirstTimerAlert());
            response.put("alertEmails",     parseAlertEmails(church.getAlertEmails()));

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to update church info: " + e.getMessage()));
        }
    }

    // ── Helper: parse comma-separated string → List ──
    private List<String> parseAlertEmails(String raw) {
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(e -> !e.isBlank())
                .collect(Collectors.toList());
    }

    // ── Helper: extract email from JWT ──
    private String getEmailFromToken(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
            return jwtUtil.extractUsername(authHeader.substring(7));
        } catch (Exception e) {
            return null;
        }
    }
}