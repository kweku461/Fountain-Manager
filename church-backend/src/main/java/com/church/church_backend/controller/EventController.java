package com.church.church_backend.controller;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable; 
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.church.church_backend.model.Event;
import com.church.church_backend.repository.EventRepository;

@RestController
@RequestMapping("/events")
public class EventController {

    private final EventRepository eventRepository;

    public EventController(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    // 🔹 Create Event
    @PostMapping("/create")
    public String createEvent(@RequestBody Event event, Authentication authentication) {
        String username = authentication.getName();
        event.setCreatedBy(username);
        eventRepository.save(event);
        return "Event created successfully by " + username;
    }

    // 🔹 Get all events
    @GetMapping
    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    // 🔹 Get a single event by ID
    @GetMapping("/{id}")
    public Event getEventById(@PathVariable Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));
    }

    // 🔹 Update an event
    @PutMapping("/{id}")
    public String updateEvent(@PathVariable Long id, @RequestBody Event updatedEvent, Authentication authentication) {
        Event existingEvent = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));

        // Optional: only allow creator or admin to update
        String username = authentication.getName();
        if (!existingEvent.getCreatedBy().equals(username)) {
            throw new RuntimeException("You are not authorized to update this event");
        }

        // Update fields (you can adjust based on your Event model)
        existingEvent.setTitle(updatedEvent.getTitle());
        existingEvent.setDescription(updatedEvent.getDescription());
        existingEvent.setDate(updatedEvent.getDate());
        existingEvent.setLocation(updatedEvent.getLocation());

        eventRepository.save(existingEvent);
        return "Event updated successfully by " + username;
    }

    // 🔹 Delete event
    @DeleteMapping("/{id}")
    public String deleteEvent(@PathVariable Long id, Authentication authentication) {
        Event existingEvent = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found with id: " + id));

        String username = authentication.getName();
        if (!existingEvent.getCreatedBy().equals(username)) {
            throw new RuntimeException("You are not authorized to delete this event");
        }

        eventRepository.deleteById(id);
        return "Event deleted successfully by " + username;
    }

    

}
