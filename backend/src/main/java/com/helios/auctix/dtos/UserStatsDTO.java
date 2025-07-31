package com.helios.auctix.dtos;

import com.helios.auctix.domain.user.SellerVerificationStatusEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class UserStatsDTO {
    private long totalUsers;
    private long sellers;
    private long bidders;
    private long admins;
}
