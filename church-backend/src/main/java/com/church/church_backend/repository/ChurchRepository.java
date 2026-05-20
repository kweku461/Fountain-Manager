package com.church.church_backend.repository;

import com.church.church_backend.model.Church;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface ChurchRepository extends JpaRepository<Church, Long> {
    Optional<Church> findByCreatedBy(String createdBy);
}