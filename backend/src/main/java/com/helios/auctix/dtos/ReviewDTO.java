package com.helios.auctix.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewDTO {
    private UUID id;
    private UUID deliveryId;
    private UUID auctionId;
    private String auctionTitle;
    private UUID sellerId;
    private String sellerName;
    private UUID buyerId;
    private String buyerName;
    private Integer rating;
    private String reviewText;
    private Instant createdAt;
    private Instant updatedAt;
}