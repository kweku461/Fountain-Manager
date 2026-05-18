package com.church.church_backend.repository;

import com.church.church_backend.model.ChurchService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChurchServiceRepository extends JpaRepository<ChurchService, Long> {
    List<ChurchService> findByCreatedBy(String createdBy);
    Optional<ChurchService> findByIdAndCreatedBy(Long id, String createdBy);
}