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

    @Column(name = "created_by")
    private String createdBy;

    @Column(nullable = false)
    private boolean firstTimerAlert = true;

    @Column(name = "alert_emails", length = 500)
    private String alertEmails;

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

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public boolean isFirstTimerAlert() { return firstTimerAlert; }
    public void setFirstTimerAlert(boolean firstTimerAlert) { this.firstTimerAlert = firstTimerAlert; }

    public String getAlertEmails() { return alertEmails; }
    public void setAlertEmails(String alertEmails) { this.alertEmails = alertEmails; }
}