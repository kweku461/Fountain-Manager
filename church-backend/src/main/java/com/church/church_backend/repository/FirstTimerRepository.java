package com.church.church_backend.repository;

import com.church.church_backend.model.FirstTimer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FirstTimerRepository extends JpaRepository<FirstTimer, Long> {
    List<FirstTimer> findByCreatedBy(String createdBy);
}