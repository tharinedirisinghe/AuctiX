package com.helios.auctix.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class SellerVerificationStatsDTO {
    private long approvedVerifications;
    private long pendingVerifications;
    private long rejectedVerifications;
    private long verifiedSellers;
}
