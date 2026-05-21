package com.church.church_backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "first_timers")
public class FirstTimer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String course;
    @Column(name = "year")
    private String  year;
    private String occupation;

    @Column(name = "phone_number", nullable = false)
    private String phoneNumber;

    @Column(name = "whatsapp_number")
    private String whatsappNumber;

    private String area;
    private String hostel;

    @Column(name = "room_number")
    private String roomNumber;

    @Column(name = "join_church")
    private String joinChurch;

    @Column(name = "join_basonta")
    private String joinBasonta;

    @Column(name = "known_person")
    private String knownPerson;

    @Column(name = "visit_date")
    private LocalDate visitDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "created_by")
    private String createdBy; // stores the email of the logged-in user
    @Column(name = "basonta_choice")
    private String basontaChoice;

    @PrePersist
    protected void onCreate() {
        this.visitDate = LocalDate.now();
        this.createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getCourse() { return course; }
    public void setCourse(String course) { this.course = course; }
    @JsonProperty("year")
    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }
    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }
    public String getWhatsappNumber() { return whatsappNumber; }
    public void setWhatsappNumber(String whatsappNumber) { this.whatsappNumber = whatsappNumber; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public String getHostel() { return hostel; }
    public void setHostel(String hostel) { this.hostel = hostel; }
    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }
    public String getJoinChurch() { return joinChurch; }
    public void setJoinChurch(String joinChurch) { this.joinChurch = joinChurch; }
    public String getJoinBasonta() { return joinBasonta; }
    public void setJoinBasonta(String joinBasonta) { this.joinBasonta = joinBasonta; }
    public String getKnownPerson() { return knownPerson; }
    public void setKnownPerson(String knownPerson) { this.knownPerson = knownPerson; }
    public LocalDate getVisitDate() { return visitDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public String getBasontaChoice() { return basontaChoice; }
    public void setBasontaChoice(String basontaChoice) { this.basontaChoice = basontaChoice; }
}