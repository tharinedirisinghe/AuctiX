package com.helios.auctix.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MyBidAuctionDTO {
    private UUID auctionId;
    private String title;
    private double currentPrice;
    private double yourHighestBid;
    private String status; // "active", "won", "lost"
    private Instant endTime;
    private boolean isLeadingBid;
    private String category;
    private List<UUID> imagePaths;
}