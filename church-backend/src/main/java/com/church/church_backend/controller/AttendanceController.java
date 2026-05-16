package com.church.church_backend.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.church.church_backend.dto.AttendanceRequest;
import com.church.church_backend.model.Attendance;
import com.church.church_backend.service.AttendanceService;

@RestController
@RequestMapping("/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;

    public AttendanceController(AttendanceService attendanceService) {
        this.attendanceService = attendanceService;
    }

    /**
     * ✅ Mark attendance for either an event or a service
     * Only one of eventId or serviceId should be provided.
     */
    @PostMapping("/mark")
public ResponseEntity<?> markAttendance(@RequestBody AttendanceRequest request) {
    if (request.getEventId() == null && request.getServiceId() == null) {
        return ResponseEntity.badRequest().body("Either eventId or serviceId must be provided.");
    }

    Attendance attendance = attendanceService.markAttendance(
            request.getMemberId(),
            request.getEventId(),
            request.getServiceId(),
            request.getStatus(),
            request.getCheckInTime()  // pass through
    );

    return ResponseEntity.ok(attendance);
}

    /** ✅ Get all attendance records for a specific event */
    @GetMapping("/event/{eventId}")
    public ResponseEntity<List<Attendance>> getByEvent(@PathVariable Long eventId) {
        return ResponseEntity.ok(attendanceService.getByEvent(eventId));
    }

    /** ✅ Get all attendance records for a specific service */
    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<Attendance>> getByService(@PathVariable Long serviceId) {
        return ResponseEntity.ok(attendanceService.getByService(serviceId));
    }

    /** ✅ Get all attendance records for a specific member */
    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<Attendance>> getByMember(@PathVariable Long memberId) {
        return ResponseEntity.ok(attendanceService.getByMember(memberId));
    }

/** ✅ Update existing attendance records for a service */
@PutMapping("/service/{serviceId}")
public ResponseEntity<?> updateByService(
        @PathVariable Long serviceId,
        @RequestBody List<AttendanceRequest> requests) {
    attendanceService.updateByService(serviceId, requests);
    return ResponseEntity.ok("Attendance updated successfully");
}

    /** ✅ Delete all attendance records for a specific service */
@DeleteMapping("/service/{serviceId}")
public ResponseEntity<String> deleteByService(@PathVariable Long serviceId) {
    attendanceService.deleteByService(serviceId);
    return ResponseEntity.ok("Attendance records deleted successfully");
}
}
