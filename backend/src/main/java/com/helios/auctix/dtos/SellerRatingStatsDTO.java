package com.helios.auctix.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerRatingStatsDTO {
    private Double averageRating;
    private Long totalReviews;
    private Map<Integer, Long> ratingDistribution; // rating -> count
    private List<ReviewDTO> recentReviews;
}