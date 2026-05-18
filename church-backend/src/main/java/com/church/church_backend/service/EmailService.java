package com.church.church_backend.service;

import com.mailjet.client.MailjetClient;
import com.mailjet.client.MailjetRequest;
import com.mailjet.client.MailjetResponse;
import com.mailjet.client.resource.Emailv31;
import org.json.JSONArray;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final MailjetClient mailjetClient;

    private static final String FROM_EMAIL = "nanakwekuhwedie461@gmail.com";
    private static final String FROM_NAME  = "Fountain Manager";

    public EmailService(
            @Value("${mailjet.api.key}")    String apiKey,
            @Value("${mailjet.api.secret}") String apiSecret
    ) {
        this.mailjetClient = new MailjetClient(apiKey, apiSecret);
    }

    // ── Shared send helper ──
    private void sendEmail(String to, String subject, String textBody) {
        try {
            MailjetRequest request = new MailjetRequest(Emailv31.resource)
                    .property(Emailv31.MESSAGES, new JSONArray()
                            .put(new JSONObject()
                                    .put(Emailv31.Message.FROM, new JSONObject()
                                            .put("Email", FROM_EMAIL)
                                            .put("Name",  FROM_NAME))
                                    .put(Emailv31.Message.TO, new JSONArray()
                                            .put(new JSONObject()
                                                    .put("Email", to)))
                                    .put(Emailv31.Message.SUBJECT,  subject)
                                    .put(Emailv31.Message.TEXTPART, textBody)
                            )
                    );

            MailjetResponse response = mailjetClient.post(request);

            if (response.getStatus() == 200) {
                System.out.println("✅ Email sent to " + to + " | Status: " + response.getStatus());
            } else {
                System.err.println("⚠️ Mailjet responded with status " + response.getStatus()
                        + " | Body: " + response.getData());
                throw new RuntimeException("Failed to send email. Mailjet status: " + response.getStatus());
            }

        } catch (Exception e) {
            System.err.println("⚠️ Failed to send email to " + to + ": " + e.getMessage());
            throw new RuntimeException("Failed to send email: " + e.getMessage());
        }
    }

    // ── OTP verification email ──
    public void sendOtp(String to, String otp) {
        sendEmail(
            to,
            "Email Verification - Fountain Manager",
            "Your verification code is: " + otp +
            "\n\nThis code expires in 10 minutes."
        );
    }

    // ── First timer alert ──
    public void sendFirstTimerAlert(String adminEmail, String fullName, String phoneNumber) {
        sendEmail(
            adminEmail,
            "New First Timer - Fountain Manager",
            "A new first timer just registered!\n\n" +
            "Name:  " + (fullName  != null && !fullName.isBlank()  ? fullName  : "Not provided") + "\n" +
            "Phone: " + (phoneNumber != null && !phoneNumber.isBlank() ? phoneNumber : "Not provided") + "\n\n" +
            "Log in to Fountain Manager to view their full details."
        );
    }
}