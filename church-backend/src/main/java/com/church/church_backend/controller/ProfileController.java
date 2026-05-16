package com.church.church_backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import com.church.church_backend.model.User;
import com.church.church_backend.repository.UserRepository;
import com.church.church_backend.security.JwtUtil;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public ProfileController(UserRepository userRepository, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
    }

    // ── Helper: extract logged-in user from JWT token ──
    private User getUserFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new RuntimeException("Unauthorized");
        }
        String token = authHeader.substring(7);
        String email = jwtUtil.extractUsername(token);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // ── GET /api/profile ── fetch current profile
    @GetMapping
    public ResponseEntity<?> getProfile(HttpServletRequest request) {
        try {
            User user = getUserFromRequest(request);
            return ResponseEntity.ok(Map.of(
                "username", user.getUsername(),
                "email",    user.getEmail()
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ── PUT /api/profile ── update username and/or email
    @PutMapping
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body,
            HttpServletRequest request
    ) {
        try {
            User user = getUserFromRequest(request);

            String newUsername = body.get("username");
            String newEmail    = body.get("email");

            if (newUsername != null && !newUsername.isBlank()) {
                user.setUsername(newUsername);
            }

            // If email is changing, check it isn't already taken
            if (newEmail != null && !newEmail.isBlank() && !newEmail.equals(user.getEmail())) {
                if (userRepository.existsByEmail(newEmail)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                            .body(Map.of("message", "Email already in use"));
                }
                user.setEmail(newEmail);
            }

            userRepository.save(user);

            return ResponseEntity.ok(Map.of(
                "message",  "Profile updated successfully",
                "username", user.getUsername(),
                "email",    user.getEmail()
            ));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    // ── PUT /api/profile/change-password ── change password
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> body,
            HttpServletRequest request
    ) {
        try {
            User user = getUserFromRequest(request);

            String currentPassword = body.get("currentPassword");
            String newPassword     = body.get("newPassword");

            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Current and new password are required"));
            }

            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("message", "Current password is incorrect"));
            }

            if (newPassword.length() < 6) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "New password must be at least 6 characters"));
            }

            user.setPassword(passwordEncoder.encode(newPassword));
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("message", "Password changed successfully"));

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", e.getMessage()));
        }
    }
}