package com.helios.auctix.domain.auction;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.Id;


import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "auction_deletion_requests")
public class AuctionDeletionRequest {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "auction_id", nullable = false)
    private UUID auctionId;

    @Column(name = "seller_id", nullable = false)
    private UUID sellerId;

    @Column(name = "deletion_reason", nullable = false, columnDefinition = "TEXT")
    private String deletionReason;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "processed_at")
    private Instant processedAt;

    @Column(name = "status")
    private String status = "PENDING";

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
    }

    // Getters and setters...
//    public UUID getId() { return id; }
//    public void setId(UUID id) { this.id = id; }
//
//    public UUID getAuctionId() { return auctionId; }
//    public void setAuctionId(UUID auctionId) { this.auctionId = auctionId; }
//
//    public UUID getSellerId() { return sellerId; }
//    public void setSellerId(UUID sellerId) { this.sellerId = sellerId; }
//
//    public String getDeletionReason() { return deletionReason; }
//    public void setDeletionReason(String deletionReason) { this.deletionReason = deletionReason; }
//
//    public Instant getCreatedAt() { return createdAt; }
//    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
//
//    public Instant getProcessedAt() { return processedAt; }
//    public void setProcessedAt(Instant processedAt) { this.processedAt = processedAt; }
//
//    public String getStatus() { return status; }
//    public void setStatus(String status) { this.status = status; }
}
