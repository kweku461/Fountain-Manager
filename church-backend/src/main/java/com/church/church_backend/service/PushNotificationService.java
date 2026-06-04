package com.church.church_backend.service;

import com.church.church_backend.model.Member;
import com.church.church_backend.model.PushSubscription;
import com.church.church_backend.repository.MemberRepository;
import com.church.church_backend.repository.PushSubscriptionRepository;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.security.Security;
import java.time.LocalDate;
import java.util.List;

@Service
public class PushNotificationService {

    private final PushSubscriptionRepository subscriptionRepository;
    private final MemberRepository memberRepository;
    private PushService pushService;

    @Value("${vapid.public.key}")
    private String vapidPublicKey;

    @Value("${vapid.private.key}")
    private String vapidPrivateKey;

    @Value("${vapid.subject}")
    private String vapidSubject;

    public PushNotificationService(
            PushSubscriptionRepository subscriptionRepository,
            MemberRepository memberRepository) {
        this.subscriptionRepository = subscriptionRepository;
        this.memberRepository = memberRepository;
    }

    @PostConstruct
    public void init() throws Exception {
        Security.addProvider(new BouncyCastleProvider());
        this.pushService = new PushService(vapidPublicKey, vapidPrivateKey, vapidSubject);
    }

    // ── Send push notification to a specific subscription ──
    public void sendNotification(PushSubscription sub, String title, String body) {
        try {
            JSONObject payload = new JSONObject();
            payload.put("title", title);
            payload.put("body", body);
            payload.put("url", "/members");

            Notification notification = new Notification(
                sub.getEndpoint(),
                sub.getP256dh(),
                sub.getAuth(),
                payload.toString().getBytes()
            );

            pushService.send(notification);
            System.out.println("✅ Push notification sent to: " + sub.getUserEmail());
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send push notification: " + e.getMessage());
        }
    }

    // ── Daily birthday check — runs every day at 8:00 AM ──
    @Scheduled(cron = "0 0 8 * * *")
    public void checkBirthdays() {
        System.out.println("🎂 Checking birthdays...");

        LocalDate today = LocalDate.now();
        int todayMonth = today.getMonthValue();
        int todayDay = today.getDayOfMonth();

        // Get all members grouped by their owner
        List<Member> allMembers = memberRepository.findAll();

        for (Member member : allMembers) {
            if (member.getBirthdate() == null) continue;
            if (member.getCreatedBy() == null) continue;

            int memberMonth = member.getBirthdate().getMonthValue();
            int memberDay = member.getBirthdate().getDayOfMonth();

            if (memberMonth == todayMonth && memberDay == todayDay) {
                // It's their birthday! Notify the owner
                List<PushSubscription> subscriptions =
                    subscriptionRepository.findByUserEmail(member.getCreatedBy());

                String title = "🎂 Birthday Reminder";
                String body = member.getFirstName() + " " + member.getLastName()
                    + "'s birthday is today! Don't forget to reach out.";

                for (PushSubscription sub : subscriptions) {
                    sendNotification(sub, title, body);
                }

                System.out.println("🎂 Birthday notification sent for: "
                    + member.getFirstName() + " " + member.getLastName());
            }
        }
    }
}