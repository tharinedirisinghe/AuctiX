package com.helios.auctix.repositories;

import com.helios.auctix.domain.user.PasswordResetRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, UUID> {
    PasswordResetRequest findTopByExpiresAtAfterAndEmailAndCodeAndIsUsedFalseOrderByCreatedAtDesc(
            Instant now, String email, String code
    );


    Integer countByExpiresAtAfterAndEmailAndIpAddressAndIsUsedFalseOrderByCreatedAtDesc(Instant now, String email, String ipAddress);
}
