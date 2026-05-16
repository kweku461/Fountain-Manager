package com.church.church_backend.service;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.church.church_backend.model.User;
import com.church.church_backend.repository.UserRepository;

import java.util.List;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email)
            throws UsernameNotFoundException {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with email: " + email)
                );

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),                 // 🔑 principal
                user.getPassword(),              // 🔒 hashed password
                user.isEnabled(),                // enabled
                true,                             // accountNonExpired
                true,                             // credentialsNonExpired
                true,                             // accountNonLocked
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole()))
        );
    }
}
