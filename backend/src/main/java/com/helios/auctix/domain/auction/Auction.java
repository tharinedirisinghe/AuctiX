package com.helios.auctix.domain.auction;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.helios.auctix.domain.user.Seller;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "auctions")
public class Auction {

    @Id
    @GeneratedValue
    private UUID id;
    private String title;
    private String description;
    private Double startingPrice;
    private Instant startTime;
    private Instant endTime;
    private Boolean isPublic;
    private String category;

    @Column(name = "completed", nullable = false)
    private Boolean completed = false;

    @Column(name = "winning_bid_id")
    private UUID winningBidId;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", referencedColumnName = "id")
    private Seller seller;

    // Use only one collection for image IDs - using ElementCollection with proper table name
    @ElementCollection
    @CollectionTable(
            name = "auction_image_paths",
            joinColumns = @JoinColumn(name = "auction_id")
    )
    @Column(name = "image_id")
    private List<UUID> imagePaths;

    // Don't use this field - it's causing database issues
    @Transient
    @JsonIgnore
    private List<UUID> imageIds;

    public UUID getSellerId() {
        return (seller != null) ? seller.getId() : null;
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
        if (this.completed == null) {
            this.completed = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }

    // New fields for deletion management
    @Column(name = "is_deleted", nullable = false, columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean isDeleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Column(name = "deletion_status")
    private String deletionStatus; // DELETED, PENDING_ADMIN_APPROVAL

    @Column(name = "penalty_fee")
    private Double penaltyFee;

//    @Enumerated(EnumType.STRING)
//    @Column(nullable = false)
//    private AuctionStatus status;

    // ... existing fields and methods ...

    // Add getters and setters for new fields
    public boolean isDeleted() {
        return isDeleted;
    }

    public void setDeleted(boolean deleted) {
        isDeleted = deleted;
    }

    public Instant getDeletedAt() {
        return deletedAt;
    }

    public void setDeletedAt(Instant deletedAt) {
        this.deletedAt = deletedAt;
    }

    public String getDeletionStatus() {
        return deletionStatus;
    }

    public void setDeletionStatus(String deletionStatus) {
        this.deletionStatus = deletionStatus;
    }

    public Double getPenaltyFee() {
        return penaltyFee;
    }

    public void setPenaltyFee(Double penaltyFee) {
        this.penaltyFee = penaltyFee;
    }

    public boolean isPublic() {
        return this.isPublic;
    }

}