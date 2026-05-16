package com.church.church_backend.controller;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.church.church_backend.dto.AuthResponse;
import com.church.church_backend.dto.LoginRequest;
import com.church.church_backend.dto.RegisterRequest;
import com.church.church_backend.dto.VerifyOtpRequest;
import com.church.church_backend.model.User;
import com.church.church_backend.repository.UserRepository;
import com.church.church_backend.security.JwtUtil;
import com.church.church_backend.service.EmailService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
@Validated
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthController(
            UserRepository userRepository,
            JwtUtil jwtUtil,
            EmailService emailService
    ) {
        this.userRepository = userRepository;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of("message", "Email already registered"));
        }

        String otp = String.valueOf((int)(Math.random() * 900000) + 100000);
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(10);

        User user = new User();
        user.setEmail(request.getEmail());
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setEnabled(false);
        user.setOtp(otp);
        user.setOtpExpiry(expiry);

        userRepository.save(user);
        emailService.sendOtp(user.getEmail(), otp);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(Map.of(
                    "message", "Registration successful",
                    "email", user.getEmail()
                ));
    }


    // ✅ VERIFY EMAIL
    @PostMapping("/verify-email")
    public String verifyEmail(@RequestBody VerifyOtpRequest request) {

        System.out.println("➡️ Verify OTP for: " + request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOtp() == null) {
            throw new RuntimeException("No OTP found");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }

        if (!user.getOtp().equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        user.setEnabled(true);
        user.setOtp(null);
        user.setOtpExpiry(null);

        userRepository.save(user);

        System.out.println("✅ Email verified successfully");

        return "Email verified successfully";
    }

    // ✅ RESEND OTP
    @PostMapping("/resend-otp")
    public String resendOtp(@RequestBody VerifyOtpRequest request) {

        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // If already verified, no need to resend
        if (user.isEnabled()) {
            return "Email already verified. No OTP needed.";
        }

        // Generate new OTP (6-digit)
        String newOtp = String.valueOf((int)(Math.random() * 900000) + 100000);
        LocalDateTime expiry = LocalDateTime.now().plusMinutes(10);

        user.setOtp(newOtp);
        user.setOtpExpiry(expiry);

        // Save user with new OTP
        userRepository.save(user);

        // Send OTP email
        emailService.sendOtp(user.getEmail(), newOtp);

        System.out.println("New OTP generated for " + user.getEmail() + ": " + newOtp);

        return "A new OTP has been sent to your email. It expires in 10 minutes.";
    }

    // ====================== FORGOT PASSWORD ENDPOINTS ======================

    @PostMapping("/forgot-password")
    public String forgotPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate OTP
        String otp = String.valueOf((int)(Math.random() * 900000) + 100000);
        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(10));

        userRepository.save(user);

        // Send OTP via email
        emailService.sendOtp(email, otp);

        return "Password reset OTP sent to your email";
    }

    @PostMapping("/verify-reset-otp")
    public String verifyResetOtp(@RequestBody VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getOtp() == null || user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }

        if (!user.getOtp().equals(request.getOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        // OTP verified, allow password reset
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        return "OTP verified. You can now reset your password";
    }

    @PostMapping("/reset-password")
    public String resetPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String newPassword = request.get("newPassword");

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Update password
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return "Password reset successful";
    }



    // ✅ LOGIN
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        if (!user.isEnabled()) {
            throw new RuntimeException("Email not verified");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtUtil.generateToken(user.getEmail());

        return new AuthResponse(token, user.getEmail(), user.getRole());
    }
}
