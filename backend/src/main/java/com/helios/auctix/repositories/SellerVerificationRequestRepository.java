package com.helios.auctix.repositories;

import com.helios.auctix.domain.user.SellerVerificationRequest;
import com.helios.auctix.domain.user.SellerVerificationStatusEnum;
import com.helios.auctix.domain.user.UserRole;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.dtos.SellerVerificationRequestSummaryDTO;
import com.helios.auctix.dtos.SellerVerificationStatsDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface SellerVerificationRequestRepository extends JpaRepository<SellerVerificationRequest, UUID> {

    List<SellerVerificationRequest> findAllBySellerId(UUID id);


    @Query("""
    SELECT new com.helios.auctix.dtos.SellerVerificationRequestSummaryDTO(
        u.id,
        u.firstName,
        u.lastName,
        u.username,
        u.email,
        (SELECT MAX(r.createdAt) FROM SellerVerificationRequest r WHERE r.seller.user.id = u.id) As createdAt,
        (SELECT COUNT(r) FROM SellerVerificationRequest r WHERE r.seller.user.id = u.id) As totalRequests,
        (SELECT COUNT(r) FROM SellerVerificationRequest r 
         WHERE r.seller.user.id = u.id 
         AND r.verificationStatus = com.helios.auctix.domain.user.SellerVerificationStatusEnum.PENDING) As pendingCount,
        (SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END
         FROM SellerVerificationRequest r
         WHERE r.seller.user.id = u.id
         AND r.verificationStatus = com.helios.auctix.domain.user.SellerVerificationStatusEnum.APPROVED) As isApproved
    )
    FROM User u
    WHERE EXISTS (
        SELECT 1 FROM SellerVerificationRequest r 
        JOIN r.seller s 
        WHERE s.user = u
        AND (:search IS NULL OR :search = '' OR
             LOWER(CONCAT(u.firstName, ' ', u.lastName, ' ', u.email)) LIKE LOWER(CONCAT('%', :search, '%')))
        AND (:statusFilter IS NULL OR r.verificationStatus = :statusFilter)
    )
""")
    Page<SellerVerificationRequestSummaryDTO> searchAndFilter(
            @Param("search") String search,
            @Param("statusFilter") SellerVerificationStatusEnum statusFilter,
            Pageable pageable);

    @Query("""
    SELECT new com.helios.auctix.dtos.SellerVerificationStatsDTO(
        COUNT(CASE WHEN r.verificationStatus = com.helios.auctix.domain.user.SellerVerificationStatusEnum.APPROVED THEN 1 END) AS approvedCount,
        COUNT(CASE WHEN r.verificationStatus = com.helios.auctix.domain.user.SellerVerificationStatusEnum.PENDING THEN 1 END) AS pendingCount,
        COUNT(CASE WHEN r.verificationStatus = com.helios.auctix.domain.user.SellerVerificationStatusEnum.REJECTED THEN 1 END) AS rejectedCount,
        COUNT(DISTINCT r.seller.id) AS verifiedSellersCount
    )
    FROM SellerVerificationRequest r
    WHERE r.verificationStatus = com.helios.auctix.domain.user.SellerVerificationStatusEnum.APPROVED
    """)
    SellerVerificationStatsDTO getSellerVerificationStats();
}