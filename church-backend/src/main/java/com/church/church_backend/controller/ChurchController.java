package com.church.church_backend.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.church.church_backend.model.Church;
import com.church.church_backend.repository.ChurchRepository;

@RestController
@RequestMapping("/api/church")
public class ChurchController {

    private final ChurchRepository churchRepository;

    public ChurchController(ChurchRepository churchRepository) {
        this.churchRepository = churchRepository;
    }

    // ── GET /api/church ──
    @GetMapping
    public ResponseEntity<?> getChurchInfo() {
        return churchRepository.findById(1L)
                .map(church -> {
                    // Use HashMap instead of Map.of() — supports null-safe values
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
    public ResponseEntity<?> updateChurchInfo(@RequestBody Map<String, Object> body) {
        try {
            Church church = churchRepository.findById(1L).orElse(new Church());

            // churchName: use existing DB value as fallback so recipients-only saves don't fail
            String churchName = (String) body.get("churchName");
            if (churchName == null || churchName.isBlank()) {
                // Fall back to whatever is already saved
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

            // Save alert emails — accept a JSON array from frontend
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
}