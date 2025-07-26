package com.helios.auctix.services;

import com.helios.auctix.domain.delivery.Delivery;
import com.helios.auctix.domain.review.Review;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.dtos.ReviewCreateDTO;
import com.helios.auctix.dtos.ReviewDTO;
import com.helios.auctix.dtos.SellerRatingStatsDTO;
import com.helios.auctix.repositories.DeliveryRepository;
import com.helios.auctix.repositories.ReviewRepository;
import com.helios.auctix.services.user.UserDetailsService;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final DeliveryRepository deliveryRepository;
    private final UserDetailsService userDetailsService;
    private static final Logger logger = Logger.getLogger(ReviewService.class.getName());

    @Transactional
    public ReviewDTO createReview(ReviewCreateDTO createDTO) {
        User currentUser = getCurrentUser();
        logger.info("Creating review for delivery: " + createDTO.getDeliveryId() + " by user: " + currentUser.getId());

        // Validate user is a bidder
        if (currentUser.getRoleEnum() != UserRoleEnum.BIDDER) {
            throw new IllegalArgumentException("Only bidders can create reviews");
        }

        // Find the delivery
        Delivery delivery = deliveryRepository.findById(createDTO.getDeliveryId())
                .orElseThrow(() -> new IllegalArgumentException("Delivery not found"));

        // Validate the buyer is the current user
        if (!delivery.getBuyer().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You can only review deliveries you received");
        }

        // Check if delivery is completed
        if (!"DELIVERED".equals(delivery.getStatus())) {
            throw new IllegalArgumentException("You can only review completed deliveries");
        }

        // Check if review already exists for this delivery
        if (reviewRepository.existsByDeliveryId(createDTO.getDeliveryId())) {
            throw new IllegalArgumentException("Review already exists for this delivery");
        }

        // Validate rating
        if (createDTO.getRating() == null || createDTO.getRating() < 1 || createDTO.getRating() > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5 stars");
        }

        // Create the review
        Review review = Review.builder()
                .delivery(delivery)
                .auction(delivery.getAuction())
                .seller(delivery.getSeller())
                .buyer(currentUser)
                .rating(createDTO.getRating())
                .reviewText(createDTO.getReviewText())
                .build();

        review = reviewRepository.save(review);
        logger.info("Successfully created review with ID: " + review.getId());

        return mapToDTO(review);
    }

    public ReviewDTO getReviewByDeliveryId(UUID deliveryId) {
        User currentUser = getCurrentUser();
        
        Review review = reviewRepository.findByDeliveryId(deliveryId)
                .orElse(null);

        if (review == null) {
            return null;
        }

        // Check if user is authorized to view this review
        boolean isAuthorized = review.getBuyer().getId().equals(currentUser.getId()) ||
                review.getSeller().getId().equals(currentUser.getId()) ||
                currentUser.getRoleEnum() == UserRoleEnum.ADMIN ||
                currentUser.getRoleEnum() == UserRoleEnum.SUPER_ADMIN;

        if (!isAuthorized) {
            throw new IllegalArgumentException("You are not authorized to view this review");
        }

        return mapToDTO(review);
    }

    public Page<ReviewDTO> getSellerReviews(UUID sellerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Review> reviews = reviewRepository.findBySellerIdOrderByCreatedAtDesc(sellerId, pageable);
        
        return reviews.map(this::mapToDTO);
    }

    public Page<ReviewDTO> getBuyerReviews(UUID buyerId, int page, int size) {
        User currentUser = getCurrentUser();
        
        // Only allow user to see their own reviews or admin access
        if (!buyerId.equals(currentUser.getId()) && 
            currentUser.getRoleEnum() != UserRoleEnum.ADMIN &&
            currentUser.getRoleEnum() != UserRoleEnum.SUPER_ADMIN) {
            throw new IllegalArgumentException("You can only view your own reviews");
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<Review> reviews = reviewRepository.findByBuyerIdOrderByCreatedAtDesc(buyerId, pageable);
        
        return reviews.map(this::mapToDTO);
    }

    public SellerRatingStatsDTO getSellerRatingStats(UUID sellerId) {
        logger.info("Getting rating stats for seller: " + sellerId);

        // Get average rating
        Double averageRating = reviewRepository.findAverageRatingBySellerId(sellerId);
        if (averageRating == null) {
            averageRating = 0.0;
        }

        // Get total reviews count
        long totalReviews = reviewRepository.countBySellerIdAndRatingGreaterThan(sellerId, 0);

        // Get rating distribution
        List<Object[]> ratingDistributionData = reviewRepository.findRatingDistributionBySellerId(sellerId);
        Map<Integer, Long> ratingDistribution = new HashMap<>();
        
        // Initialize all ratings to 0
        for (int i = 1; i <= 5; i++) {
            ratingDistribution.put(i, 0L);
        }
        
        // Fill in actual counts
        for (Object[] row : ratingDistributionData) {
            Integer rating = (Integer) row[0];
            Long count = (Long) row[1];
            ratingDistribution.put(rating, count);
        }

        // Get recent reviews
        List<Review> recentReviewsData = reviewRepository.findTop10BySellerIdOrderByCreatedAtDesc(sellerId);
        List<ReviewDTO> recentReviews = recentReviewsData.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());

        return SellerRatingStatsDTO.builder()
                .averageRating(Math.round(averageRating * 100.0) / 100.0) // Round to 2 decimal places
                .totalReviews(totalReviews)
                .ratingDistribution(ratingDistribution)
                .recentReviews(recentReviews)
                .build();
    }

    public boolean canReviewDelivery(UUID deliveryId) {
        User currentUser = getCurrentUser();
        
        if (currentUser.getRoleEnum() != UserRoleEnum.BIDDER) {
            return false;
        }

        Delivery delivery = deliveryRepository.findById(deliveryId).orElse(null);
        if (delivery == null) {
            return false;
        }

        // Check if user is the buyer and delivery is completed
        boolean isBuyer = delivery.getBuyer().getId().equals(currentUser.getId());
        boolean isDelivered = "DELIVERED".equals(delivery.getStatus());
        boolean reviewExists = reviewRepository.existsByDeliveryId(deliveryId);

        return isBuyer && isDelivered && !reviewExists;
    }

    @Transactional
    public ReviewDTO updateReview(UUID reviewId, ReviewCreateDTO updateDTO) {
        User currentUser = getCurrentUser();
        
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        // Only allow the reviewer (buyer) to update their review
        if (!review.getBuyer().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You can only update your own reviews");
        }

        // Validate rating if provided
        if (updateDTO.getRating() != null) {
            if (updateDTO.getRating() < 1 || updateDTO.getRating() > 5) {
                throw new IllegalArgumentException("Rating must be between 1 and 5 stars");
            }
            review.setRating(updateDTO.getRating());
        }

        // Update review text if provided
        if (updateDTO.getReviewText() != null) {
            review.setReviewText(updateDTO.getReviewText());
        }

        review = reviewRepository.save(review);
        logger.info("Successfully updated review with ID: " + review.getId());

        return mapToDTO(review);
    }

    @Transactional
    public void deleteReview(UUID reviewId) {
        User currentUser = getCurrentUser();
        
        Review review = reviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        // Only allow the reviewer (buyer) or admin to delete the review
        boolean canDelete = review.getBuyer().getId().equals(currentUser.getId()) ||
                currentUser.getRoleEnum() == UserRoleEnum.ADMIN ||
                currentUser.getRoleEnum() == UserRoleEnum.SUPER_ADMIN;

        if (!canDelete) {
            throw new IllegalArgumentException("You are not authorized to delete this review");
        }

        reviewRepository.delete(review);
        logger.info("Successfully deleted review with ID: " + reviewId);
    }

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new RuntimeException("Not authenticated");
        }

        try {
            return userDetailsService.getAuthenticatedUser(authentication);
        } catch (Exception e) {
            throw new RuntimeException("Authentication error: " + e.getMessage());
        }
    }

    private ReviewDTO mapToDTO(Review review) {
        if (review == null) {
            return null;
        }

        return ReviewDTO.builder()
                .id(review.getId())
                .deliveryId(review.getDelivery().getId())
                .auctionId(review.getAuction().getId())
                .auctionTitle(review.getAuction().getTitle())
                .sellerId(review.getSeller().getId())
                .sellerName(review.getSeller().getUsername())
                .buyerId(review.getBuyer().getId())
                .buyerName(review.getBuyer().getUsername())
                .rating(review.getRating())
                .reviewText(review.getReviewText())
                .createdAt(review.getCreatedAt())
                .updatedAt(review.getUpdatedAt())
                .build();
    }
}