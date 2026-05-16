package com.church.church_backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.church.church_backend.model.ChurchService;
import com.church.church_backend.repository.ChurchServiceRepository;

@Service
public class ServiceService {

    private final ChurchServiceRepository churchServiceRepository;

    public ServiceService(ChurchServiceRepository churchServiceRepository) {
        this.churchServiceRepository = churchServiceRepository;
    }

    public ChurchService createService(ChurchService churchService) {
        return churchServiceRepository.save(churchService);
    }

    public List<ChurchService> getAllServices() {
        return churchServiceRepository.findAll();
    }

    public ChurchService getServiceById(Long id) {
        return churchServiceRepository.findById(id).orElse(null);
    }

    public ChurchService updateService(Long id, ChurchService updatedService) {
        var existing = churchServiceRepository.findById(id).orElse(null);
        if (existing == null) return null;

        existing.setTitle(updatedService.getTitle());
        existing.setDescription(updatedService.getDescription());
        existing.setLocation(updatedService.getLocation());
        existing.setStartTime(updatedService.getStartTime());
        existing.setEndTime(updatedService.getEndTime());
        existing.setPreacher(updatedService.getPreacher());
        existing.setLivestreamAvailable(updatedService.isLivestreamAvailable());
        return churchServiceRepository.save(existing);
    }

    public void deleteService(Long id) {
        churchServiceRepository.deleteById(id);
    }
}
