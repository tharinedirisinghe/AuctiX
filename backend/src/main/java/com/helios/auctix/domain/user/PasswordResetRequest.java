package com.helios.auctix.domain.user;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "password_reset_requests")
public class PasswordResetRequest {

    @Id
    @GeneratedValue(generator = "UUID")
    @Column(columnDefinition = "UUID")
    private UUID id;


    @ManyToOne
    @JoinColumn(name = "email", referencedColumnName = "email", insertable = false, updatable = false)
    private User user;

    @Column(name = "email", nullable = false)
    private String email;

    @Column(name = "ip_address", nullable = false, columnDefinition = "TEXT")
    private String ipAddress;

    @Column(length = 6, nullable = false)
    private String code;

    @Column(name = "is_used", nullable = false)
    private boolean isUsed = false;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "code_checks", nullable = false)
    private int codeChecks;

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        // Set the expiration time to 1 hour after creation
        this.expiresAt = createdAt.plusSeconds(3600);
    }
}
