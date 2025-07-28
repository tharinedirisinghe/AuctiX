package com.helios.auctix.dtos;

import com.helios.auctix.domain.user.Seller;
import com.helios.auctix.domain.user.SellerVerificationRequest;
import com.helios.auctix.domain.user.SellerVerificationStatusEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.Instant;
import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class SellerVerificationRequestSummaryDTO {
    private UUID id;
    private String sellerFirstName;
    private String sellerLastName;
    private String username;
    private String email;
    private Integer totalDocumentsSubmitted;
    private Integer pendingDocumentsCount;
    private SellerVerificationStatusEnum verificationStatus;
    private Instant submittedAt;


    public SellerVerificationRequestSummaryDTO(UUID id, String firstName, String lastName , String username, String email, Instant submittedAt ,long totalDocumentsSubmitted, long pendingDocumentsCount, boolean isApprovedAtLeastOne) {
        this.id = id;
        this.totalDocumentsSubmitted = (int) totalDocumentsSubmitted;
        this.pendingDocumentsCount = (int) pendingDocumentsCount;
        this.verificationStatus = isApprovedAtLeastOne? SellerVerificationStatusEnum.APPROVED : SellerVerificationStatusEnum.PENDING;
        this.sellerFirstName = firstName;
        this.sellerLastName = lastName;
        this.username = username;
        this.email = email;
        this.submittedAt = submittedAt;
    }
}
