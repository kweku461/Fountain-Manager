package com.church.church_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.church.church_backend.model.Attendance;
import com.church.church_backend.model.ChurchService;
import com.church.church_backend.model.Event;
import com.church.church_backend.model.Member;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByEvent(Event event);
    List<Attendance> findByService(ChurchService service);
    List<Attendance> findByMember(Member member);
}
