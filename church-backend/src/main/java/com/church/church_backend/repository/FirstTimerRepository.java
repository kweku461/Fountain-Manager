package com.church.church_backend.repository;

import com.church.church_backend.model.FirstTimer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FirstTimerRepository extends JpaRepository<FirstTimer, Long> {
}