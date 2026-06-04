package com.church.church_backend.controller;

import com.church.church_backend.model.PushSubscription;
import com.church.church_backend.repository.PushSubscriptionRepository;
import com.church.church_backend.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/push")
public class PushSubscriptionController {

    private final PushSubscriptionRepository subscriptionRepository;
    private final JwtUtil jwtUtil;

    public PushSubscriptionController(
            PushSubscriptionRepository subscriptionRepository,
            JwtUtil jwtUtil) {
        this.subscriptionRepository = subscriptionRepository;
        this.jwtUtil = jwtUtil;
    }

    // ── Save push subscription ──
    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        try {
            String email = getEmailFromToken(request);
            if (email == null) return ResponseEntity.status(401).build();

            String endpoint = (String) body.get("endpoint");
            Map<String, String> keys = (Map<String, String>) body.get("keys");

            // Update if exists, create if not
            PushSubscription sub = subscriptionRepository
                    .findByEndpoint(endpoint)
                    .orElse(new PushSubscription());

            sub.setUserEmail(email);
            sub.setEndpoint(endpoint);
            sub.setP256dh(keys.get("p256dh"));
            sub.setAuth(keys.get("auth"));

            subscriptionRepository.save(sub);
            System.out.println("✅ Push subscription saved for: " + email);

            return ResponseEntity.ok(Map.of("message", "Subscribed successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Failed to save subscription"));
        }
    }

    // ── Remove push subscription ──
    @PostMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");
        subscriptionRepository.findByEndpoint(endpoint)
                .ifPresent(subscriptionRepository::delete);
        return ResponseEntity.ok(Map.of("message", "Unsubscribed successfully"));
    }

    // ── Get VAPID public key ──
    @GetMapping("/vapid-public-key")
    public ResponseEntity<?> getVapidPublicKey(
            @org.springframework.beans.factory.annotation.Value("${vapid.public.key}") String key) {
        return ResponseEntity.ok(Map.of("publicKey", key));
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