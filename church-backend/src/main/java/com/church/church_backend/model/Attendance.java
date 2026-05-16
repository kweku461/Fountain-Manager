package com.church.church_backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import com.fasterxml.jackson.annotation.JsonFormat;



@Entity
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The member who attended
    @ManyToOne
    @JoinColumn(name = "member_id", nullable = false)
    private Member member;

    // The event attended (nullable because it could be a service)
    @ManyToOne
    @JoinColumn(name = "event_id")
    private Event event;

    // The service attended (nullable because it could be an event)
    @ManyToOne
    @JoinColumn(name = "service_id")
    private ChurchService service;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime checkInTime = LocalDateTime.now();
    private String status; // e.g. Present, Absent, Late

    public Attendance() {}

    // Getters and Setters
    public Long getId() { return id; }

    public Member getMember() { return member; }
    public void setMember(Member member) { this.member = member; }

    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }

    public ChurchService getService() { return service; }
    public void setService(ChurchService service) { this.service = service; }

    public LocalDateTime getCheckInTime() { return checkInTime; }
    public void setCheckInTime(LocalDateTime checkInTime) { this.checkInTime = checkInTime; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
