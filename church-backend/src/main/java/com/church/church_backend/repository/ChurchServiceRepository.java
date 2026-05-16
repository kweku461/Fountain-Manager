package com.church.church_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.church.church_backend.model.ChurchService;

@Repository
public interface ChurchServiceRepository extends JpaRepository<ChurchService, Long> {
}
