package com.church.church_backend.controller;

import java.util.List;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.church.church_backend.model.Member;
import com.church.church_backend.repository.MemberRepository;
import com.church.church_backend.security.JwtUtil;

@RestController
@RequestMapping("/api/members")
public class MemberController {

    private final MemberRepository memberRepository;
    private final JwtUtil jwtUtil;

    public MemberController(MemberRepository memberRepository, JwtUtil jwtUtil) {
        this.memberRepository = memberRepository;
        this.jwtUtil = jwtUtil;
    }

    // Get only THIS user's members
    @GetMapping
    public List<Member> getAllMembers(HttpServletRequest request) {
        String email = getEmailFromToken(request);
        return memberRepository.findByCreatedBy(email);
    }

    // Create member and tag it to THIS user
    @PostMapping
    public Member createMember(@RequestBody Member member, HttpServletRequest request) {
        String email = getEmailFromToken(request);
        member.setCreatedBy(email);
        return memberRepository.save(member);
    }

    // Get single member (only if it belongs to this user)
    @GetMapping("/{id}")
    public ResponseEntity<Member> getMemberById(@PathVariable Long id, HttpServletRequest request) {
        String email = getEmailFromToken(request);
        return memberRepository.findById(id)
                .filter(m -> email.equals(m.getCreatedBy()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Update member (only if it belongs to this user)
    @PutMapping("/{id}")
    public ResponseEntity<Member> updateMember(@PathVariable Long id,
                                                @RequestBody Member memberDetails,
                                                HttpServletRequest request) {
        String email = getEmailFromToken(request);
        return memberRepository.findById(id)
                .filter(m -> email.equals(m.getCreatedBy()))
                .map(m -> {
                    m.setFirstName(memberDetails.getFirstName());
                    m.setLastName(memberDetails.getLastName());
                    m.setEmail(memberDetails.getEmail());
                    m.setPhone(memberDetails.getPhone());
                    m.setAddress(memberDetails.getAddress());
                    m.setBirthdate(memberDetails.getBirthdate());
                    m.setBasonta(memberDetails.getBasonta());
                    return ResponseEntity.ok(memberRepository.save(m));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Delete member (only if it belongs to this user)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMember(@PathVariable Long id, HttpServletRequest request) {
        String email = getEmailFromToken(request);
        return memberRepository.findById(id)
                .filter(m -> email.equals(m.getCreatedBy()))
                .map(m -> {
                    memberRepository.delete(m);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }

    private String getEmailFromToken(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return null;
        return jwtUtil.extractUsername(authHeader.substring(7));
    }
}