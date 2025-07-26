package com.helios.auctix.dtos;

import com.fasterxml.jackson.annotation.JsonFormat;
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
public class AuctionDetailsDTO {
    private String id;
    private String category;
    private String title;
    private String description;
    private List<String> images;
    private UserDTO seller;
    private double startingPrice;

    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private String endTime;
    private String startTime;
    private List<BidDTO> bidHistory;
    private BidDTO currentHighestBid;

    // ADD these new fields for deletion status
    private boolean isDeleted;
    private String deletionStatus;
    private String status; // Add general status field

    // Getters and setters for new fields
    public boolean isDeleted() {
        return isDeleted;
    }

    public void setDeleted(boolean deleted) {
        isDeleted = deleted;
    }

}
