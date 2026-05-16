package com.church.church_backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.church.church_backend.model.Member;

@Repository
public interface MemberRepository extends JpaRepository<Member, Long> {
}
