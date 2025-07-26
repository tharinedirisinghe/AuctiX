package com.helios.auctix.controllers;

import com.helios.auctix.domain.user.User;
import com.helios.auctix.dtos.ReviewCreateDTO;
import com.helios.auctix.dtos.ReviewDTO;
import com.helios.auctix.dtos.SellerRatingStatsDTO;
import com.helios.auctix.services.ReviewService;
import com.helios.auctix.services.user.UserDetailsService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/reviews")
@AllArgsConstructor
@Slf4j
public class ReviewController {

    private final ReviewService reviewService;
    private final UserDetailsService userDetailsService;
    private static final Logger logger = Logger.getLogger(ReviewController.class.getName());

    @PostMapping
    public ResponseEntity<?> createReview(@RequestBody ReviewCreateDTO reviewCreateDTO) {
        try {
            ReviewDTO createdReview = reviewService.createReview(reviewCreateDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdReview);
        } catch (IllegalArgumentException e) {
            logger.warning("Error creating review: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.severe("Error creating review: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error creating review: " + e.getMessage());
        }
    }

    @GetMapping("/delivery/{deliveryId}")
    public ResponseEntity<?> getReviewByDeliveryId(@PathVariable UUID deliveryId) {
        try {
            ReviewDTO review = reviewService.getReviewByDeliveryId(deliveryId);
            if (review == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(review);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            logger.warning("Error fetching review: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching review: " + e.getMessage());
        }
    }

    @GetMapping("/delivery/{deliveryId}/can-review")
    public ResponseEntity<Boolean> canReviewDelivery(@PathVariable UUID deliveryId) {
        try {
            boolean canReview = reviewService.canReviewDelivery(deliveryId);
            return ResponseEntity.ok(canReview);
        } catch (Exception e) {
            logger.warning("Error checking review eligibility: " + e.getMessage());
            return ResponseEntity.ok(false);
        }
    }

    @GetMapping("/seller/{sellerId}")
    public ResponseEntity<?> getSellerReviews(
            @PathVariable UUID sellerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<ReviewDTO> reviews = reviewService.getSellerReviews(sellerId, page, size);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            logger.warning("Error fetching seller reviews: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching seller reviews: " + e.getMessage());
        }
    }

    @GetMapping("/buyer/{buyerId}")
    public ResponseEntity<?> getBuyerReviews(
            @PathVariable UUID buyerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Page<ReviewDTO> reviews = reviewService.getBuyerReviews(buyerId, page, size);
            return ResponseEntity.ok(reviews);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (Exception e) {
            logger.warning("Error fetching buyer reviews: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching buyer reviews: " + e.getMessage());
        }
    }

    @GetMapping("/seller/{sellerId}/stats")
    public ResponseEntity<?> getSellerRatingStats(@PathVariable UUID sellerId) {
        try {
            SellerRatingStatsDTO stats = reviewService.getSellerRatingStats(sellerId);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.warning("Error fetching seller rating stats: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching seller rating stats: " + e.getMessage());
        }
    }

    @PutMapping("/{reviewId}")
    public ResponseEntity<?> updateReview(
            @PathVariable UUID reviewId,
            @RequestBody ReviewCreateDTO updateDTO) {
        try {
            ReviewDTO updatedReview = reviewService.updateReview(reviewId, updateDTO);
            return ResponseEntity.ok(updatedReview);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.warning("Error updating review: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating review: " + e.getMessage());
        }
    }

    @DeleteMapping("/{reviewId}")
    public ResponseEntity<?> deleteReview(@PathVariable UUID reviewId) {
        try {
            reviewService.deleteReview(reviewId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            logger.warning("Error deleting review: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting review: " + e.getMessage());
        }
    }

    // Endpoints for current user (using authentication context)
    @GetMapping("/my-reviews")
    public ResponseEntity<?> getMyReviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            User currentUser = getCurrentUser();
            Page<ReviewDTO> reviews = reviewService.getSellerReviews(currentUser.getId(), page, size);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            logger.warning("Error fetching my reviews: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching my reviews: " + e.getMessage());
        }
    }

    @GetMapping("/my-stats")
    public ResponseEntity<?> getMyRatingStats() {
        try {
            User currentUser = getCurrentUser();
            SellerRatingStatsDTO stats = reviewService.getSellerRatingStats(currentUser.getId());
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            logger.warning("Error fetching my rating stats: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error fetching my rating stats: " + e.getMessage());
        }
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
}