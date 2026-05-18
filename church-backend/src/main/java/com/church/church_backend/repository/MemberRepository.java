package com.church.church_backend.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.church.church_backend.model.Member;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
    List<Member> findByCreatedBy(String createdBy);
}
