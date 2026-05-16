package com.church.church_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.church.church_backend.model.Event;

public interface EventRepository extends JpaRepository<Event, Long> {
}
