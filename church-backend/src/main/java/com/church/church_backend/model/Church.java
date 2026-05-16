package com.church.church_backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "church_info")
public class Church {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String churchName;

    private String address;
    private String serviceDay;
    private String serviceTime;

    // ── Notification preferences ──
    @Column(nullable = false)
    private boolean firstTimerAlert = true;

    // ── Alert recipients (comma-separated, max 3 emails) ──
    @Column(name = "alert_emails", length = 500)
    private String alertEmails; // e.g. "a@mail.com,b@mail.com,c@mail.com"

    // =====================
    // GETTERS & SETTERS
    // =====================

    public Long getId() { return id; }

    public String getChurchName() { return churchName; }
    public void setChurchName(String churchName) { this.churchName = churchName; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getServiceDay() { return serviceDay; }
    public void setServiceDay(String serviceDay) { this.serviceDay = serviceDay; }

    public String getServiceTime() { return serviceTime; }
    public void setServiceTime(String serviceTime) { this.serviceTime = serviceTime; }

    public boolean isFirstTimerAlert() { return firstTimerAlert; }
    public void setFirstTimerAlert(boolean firstTimerAlert) { this.firstTimerAlert = firstTimerAlert; }

    public String getAlertEmails() { return alertEmails; }
    public void setAlertEmails(String alertEmails) { this.alertEmails = alertEmails; }
}