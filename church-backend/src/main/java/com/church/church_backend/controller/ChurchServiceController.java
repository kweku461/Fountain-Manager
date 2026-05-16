package com.church.church_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.church.church_backend.model.ChurchService;
import com.church.church_backend.service.ServiceService;

@RestController
@RequestMapping("/services")
public class ChurchServiceController {

    private final ServiceService serviceService;

    public ChurchServiceController(ServiceService serviceService) {
        this.serviceService = serviceService;
    }

    @PostMapping("/create")
    public ResponseEntity<ChurchService> createService(@RequestBody ChurchService service) {
        return ResponseEntity.ok(serviceService.createService(service));
    }

    @GetMapping
    public ResponseEntity<List<ChurchService>> getAllServices() {
        return ResponseEntity.ok(serviceService.getAllServices());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ChurchService> getServiceById(@PathVariable Long id) {
        ChurchService service = serviceService.getServiceById(id);
        return service != null ? ResponseEntity.ok(service) : ResponseEntity.notFound().build();
    }

    @PutMapping("/update/{id}")
    public ResponseEntity<ChurchService> updateService(@PathVariable Long id, @RequestBody ChurchService updatedService) {
        ChurchService service = serviceService.updateService(id, updatedService);
        return service != null ? ResponseEntity.ok(service) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<String> deleteService(@PathVariable Long id) {
        serviceService.deleteService(id);
        return ResponseEntity.ok("Church service deleted successfully");
    }
}
