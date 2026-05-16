package com.church.church_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.church.church_backend.model.Church;

public interface ChurchRepository extends JpaRepository<Church, Long> {
    // Only one church record will ever exist (id = 1)
    // All queries use findById(1L) — no extra methods needed
}