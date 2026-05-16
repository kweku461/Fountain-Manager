package com.church.church_backend.service;

import com.church.church_backend.dto.AttendanceRequest;
import com.church.church_backend.model.*;
import com.church.church_backend.repository.*;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final EventRepository eventRepository;
    private final ChurchServiceRepository serviceRepository;
    private final MemberRepository memberRepository;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             EventRepository eventRepository,
                             ChurchServiceRepository serviceRepository,
                             MemberRepository memberRepository) {
        this.attendanceRepository = attendanceRepository;
        this.eventRepository = eventRepository;
        this.serviceRepository = serviceRepository;
        this.memberRepository = memberRepository;
    }

    public Attendance markAttendance(Long memberId, Long eventId, Long serviceId, String status, LocalDateTime checkInTime) {
    Member member = memberRepository.findById(memberId)
            .orElseThrow(() -> new RuntimeException("Member not found"));

    Attendance attendance = new Attendance();
    attendance.setMember(member);
    attendance.setStatus(status);

    // Use provided checkInTime if available, otherwise default to now
    attendance.setCheckInTime(checkInTime != null ? checkInTime : LocalDateTime.now());

    if (eventId != null) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        attendance.setEvent(event);
    } else if (serviceId != null) {
        ChurchService service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        attendance.setService(service);
    } else {
        throw new RuntimeException("Either eventId or serviceId must be provided");
    }

    return attendanceRepository.save(attendance);
}

    public List<Attendance> getByEvent(Long eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        return attendanceRepository.findByEvent(event);
    }

    public List<Attendance> getByService(Long serviceId) {
        ChurchService service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        return attendanceRepository.findByService(service);
    }

    public List<Attendance> getByMember(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Member not found"));
        return attendanceRepository.findByMember(member);
    }

public void updateByService(Long serviceId, List<AttendanceRequest> requests) {
    ChurchService service = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new RuntimeException("Service not found"));

    for (AttendanceRequest request : requests) {
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        // Find existing record for this member + service
        List<Attendance> existing = attendanceRepository.findByService(service)
                .stream()
                .filter(a -> a.getMember().getId().equals(request.getMemberId()))
                .collect(java.util.stream.Collectors.toList());

        if (!existing.isEmpty()) {
            // Update existing record
            Attendance record = existing.get(0);
            record.setStatus(request.getStatus());
            if (request.getCheckInTime() != null) {
                record.setCheckInTime(request.getCheckInTime());
            }
            attendanceRepository.save(record);
        } else {
            // Create new record if none exists
            Attendance record = new Attendance();
            record.setMember(member);
            record.setService(service);
            record.setStatus(request.getStatus());
            record.setCheckInTime(
                request.getCheckInTime() != null
                    ? request.getCheckInTime()
                    : java.time.LocalDateTime.now()
            );
            attendanceRepository.save(record);
        }
    }
}

    public void deleteByService(Long serviceId) {
    ChurchService service = serviceRepository.findById(serviceId)
            .orElseThrow(() -> new RuntimeException("Service not found"));
    List<Attendance> records = attendanceRepository.findByService(service);
    attendanceRepository.deleteAll(records);
}
}
