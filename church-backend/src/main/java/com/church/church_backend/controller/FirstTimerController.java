package com.church.church_backend.controller;

import com.church.church_backend.model.FirstTimer;
import com.church.church_backend.model.Church;
import com.church.church_backend.repository.FirstTimerRepository;
import com.church.church_backend.repository.ChurchRepository;
import com.church.church_backend.repository.UserRepository;
import com.church.church_backend.service.EmailService;
import com.church.church_backend.security.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/first-timers")
public class FirstTimerController {

    private final FirstTimerRepository repository;
    private final ChurchRepository churchRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final JwtUtil jwtUtil;

    public FirstTimerController(
            FirstTimerRepository repository,
            ChurchRepository churchRepository,
            UserRepository userRepository,
            EmailService emailService,
            JwtUtil jwtUtil
    ) {
        this.repository = repository;
        this.churchRepository = churchRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
public List<FirstTimer> getAll(HttpServletRequest request) {
    String email = getEmailFromToken(request);
    return repository.findByCreatedBy(email);
}

@PostMapping
public ResponseEntity<FirstTimer> create(
        @RequestBody FirstTimer firstTimer,
        HttpServletRequest request
) {
    String email = getEmailFromToken(request);
    firstTimer.setCreatedBy(email); // tag to this user
    FirstTimer saved = repository.save(firstTimer);

    try {
        Church church = churchRepository.findById(1L).orElse(null);
        boolean alertEnabled = church != null ? church.isFirstTimerAlert() : true;

        if (alertEnabled) {
            List<String> recipients = getAlertRecipients(church);

            if (!recipients.isEmpty()) {
                for (String recipient : recipients) {
                    emailService.sendFirstTimerAlert(recipient, saved.getFullName(), saved.getPhoneNumber());
                }
            } else {
                if (email != null) {
                    emailService.sendFirstTimerAlert(email, saved.getFullName(), saved.getPhoneNumber());
                }
            }
        }
    } catch (Exception e) {
        System.err.println("⚠️ Failed to send first timer alert: " + e.getMessage());
    }

    return ResponseEntity.ok(saved);
}

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private List<String> getAlertRecipients(Church church) {
        if (church == null) return List.of();
        String raw = church.getAlertEmails();
        if (raw == null || raw.isBlank()) return List.of();
        return Arrays.stream(raw.split(","))
                .map(String::trim)
                .filter(e -> !e.isBlank())
                .limit(3)
                .collect(Collectors.toList());
    }

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