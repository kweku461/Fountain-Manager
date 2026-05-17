package com.church.church_backend.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final Resend resend;

    private static final String FROM = "Fountain Manager <onboarding@resend.dev>";

    public EmailService(@Value("${resend.api.key}") String apiKey) {
        this.resend = new Resend(apiKey);
    }

    // ── OTP verification email ──
    public void sendOtp(String to, String otp) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(FROM)
                    .to(to)
                    .subject("Email Verification - Fountain Manager")
                    .text(
                        "Your verification code is: " + otp +
                        "\n\nThis code expires in 10 minutes."
                    )
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            System.out.println("✅ OTP email sent, id: " + response.getId());

        } catch (ResendException e) {
            System.err.println("⚠️ Failed to send OTP email: " + e.getMessage());
            throw new RuntimeException("Failed to send OTP email: " + e.getMessage());
        }
    }

    // ── First timer alert ──
    public void sendFirstTimerAlert(String adminEmail, String fullName, String phoneNumber) {
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(FROM)
                    .to(adminEmail)
                    .subject("New First Timer - Fountain Manager")
                    .text(
                        "A new first timer just registered!\n\n" +
                        "Name:  " + (fullName != null ? fullName : "Not provided") + "\n" +
                        "Phone: " + (phoneNumber != null && !phoneNumber.isBlank() ? phoneNumber : "Not provided") + "\n\n" +
                        "Log in to Fountain Manager to view their full details."
                    )
                    .build();

            CreateEmailResponse response = resend.emails().send(params);
            System.out.println("✅ First timer alert sent, id: " + response.getId());

        } catch (ResendException e) {
            System.err.println("⚠️ Failed to send first timer alert: " + e.getMessage());
        }
    }
}