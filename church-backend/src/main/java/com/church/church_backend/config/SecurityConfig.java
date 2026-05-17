package com.church.church_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.church.church_backend.security.JwtAuthenticationFilter;
import com.church.church_backend.security.RateLimitFilter;

import java.util.Arrays;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final RateLimitFilter rateLimitFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter, RateLimitFilter rateLimitFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.rateLimitFilter = rateLimitFilter;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
            // Local development
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:8080",
            // Production frontend on Render
            "https://fountain-manager-church-frontend.onrender.com"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                    // Auth routes — public
                    .requestMatchers("/auth/**").permitAll()

                    // Events
                    .requestMatchers(HttpMethod.GET, "/events/**").permitAll()
                    .requestMatchers(HttpMethod.POST, "/events/create").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/events/**").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/events/**").authenticated()

                    // Services
                    .requestMatchers(HttpMethod.POST, "/services/create").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/services/**").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/services/**").authenticated()

                    // Members
                    .requestMatchers(HttpMethod.GET, "/api/members/**").authenticated()
                    .requestMatchers(HttpMethod.POST, "/api/members").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/members/**").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/members/**").authenticated()

                    // First Timers
                    .requestMatchers(HttpMethod.POST, "/api/first-timers").permitAll()
                    .requestMatchers(HttpMethod.GET, "/api/first-timers/**").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/api/first-timers/**").authenticated()

                    // Attendance
                    .requestMatchers(HttpMethod.POST, "/attendance/mark").authenticated()
                    .requestMatchers(HttpMethod.GET, "/attendance/**").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/attendance/**").authenticated()
                    .requestMatchers(HttpMethod.DELETE, "/attendance/service/**").authenticated()

                    // Profile
                    .requestMatchers(HttpMethod.GET, "/api/profile").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/profile").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/profile/change-password").authenticated()

                    // Church info
                    .requestMatchers(HttpMethod.GET, "/api/church").authenticated()
                    .requestMatchers(HttpMethod.PUT, "/api/church").authenticated()

                    // Everything else requires authentication
                    .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}