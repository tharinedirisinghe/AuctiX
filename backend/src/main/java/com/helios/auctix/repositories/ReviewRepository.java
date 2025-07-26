package com.helios.auctix.repositories;

import com.helios.auctix.domain.review.Review;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {

    // Check if review exists for a delivery
    boolean existsByDeliveryId(UUID deliveryId);

    // Find review by delivery ID
    Optional<Review> findByDeliveryId(UUID deliveryId);

    // Get all reviews for a seller
    Page<Review> findBySellerIdOrderByCreatedAtDesc(UUID sellerId, Pageable pageable);

    // Get all reviews by a buyer
    Page<Review> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId, Pageable pageable);

    // Get reviews for a specific auction
    List<Review> findByAuctionIdOrderByCreatedAtDesc(UUID auctionId);

    // Check if buyer already reviewed seller for this auction
    boolean existsByBuyerIdAndSellerIdAndAuctionId(UUID buyerId, UUID sellerId, UUID auctionId);

    // Calculate average rating for a seller
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.seller.id = :sellerId")
    Double findAverageRatingBySellerId(UUID sellerId);

    // Count total reviews for a seller
    long countBySellerIdAndRatingGreaterThan(UUID sellerId, Integer rating);

    // Count reviews by rating for a seller
    @Query("SELECT r.rating, COUNT(r) FROM Review r WHERE r.seller.id = :sellerId GROUP BY r.rating ORDER BY r.rating")
    List<Object[]> findRatingDistributionBySellerId(UUID sellerId);

    // Get latest reviews for a seller (for displaying recent feedback)
    List<Review> findTop10BySellerIdOrderByCreatedAtDesc(UUID sellerId);
}