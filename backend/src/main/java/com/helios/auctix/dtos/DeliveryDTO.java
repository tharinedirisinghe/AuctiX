package com.helios.auctix.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeliveryDTO {
    private UUID id;
    private UUID auctionId;
    private String auctionTitle;
    private UUID sellerId;
    private String sellerName;
    private UUID buyerId;
    private String buyerName;
    private LocalDate deliveryDate;
    private String status;
    private String deliveryAddress;
    private String notes;
    private Double amount;
    private String trackingNumber;
    private Boolean addressRequested;
    private Instant createdAt;
    private Instant updatedAt;
    private String buyerLocation;
    private String auctionImage;
    private String auctionCategory;
}