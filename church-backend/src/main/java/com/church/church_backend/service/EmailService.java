package com.church.church_backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ── Existing: OTP verification email ──
    public void sendOtp(String to, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject("Email Verification - Fountain Manager");
        message.setText(
            "Your verification code is: " + otp +
            "\n\nThis code expires in 10 minutes."
        );
        mailSender.send(message);
    }

    // ── Fixed: First timer alert using fullName and phoneNumber ──
    public void sendFirstTimerAlert(String adminEmail, String fullName, String phoneNumber) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail);
        message.setSubject("New First Timer - Fountain Manager");
        message.setText(
            "A new first timer just registered!\n\n" +
            "Name:  " + (fullName != null ? fullName : "Not provided") + "\n" +
            "Phone: " + (phoneNumber != null && !phoneNumber.isBlank() ? phoneNumber : "Not provided") + "\n\n" +
            "Log in to Fountain Manager to view their full details."
        );
        mailSender.send(message);
    }
}