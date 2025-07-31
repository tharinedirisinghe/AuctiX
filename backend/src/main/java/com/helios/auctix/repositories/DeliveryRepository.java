package com.helios.auctix.repositories;

import com.helios.auctix.domain.delivery.Delivery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DeliveryRepository extends JpaRepository<Delivery, UUID> {

    @Query("SELECT d FROM Delivery d JOIN FETCH d.auction a LEFT JOIN FETCH a.imagePaths WHERE d.seller.id = :sellerId ORDER BY d.createdAt DESC")
    List<Delivery> findBySellerIdOrderByCreatedAtDesc(UUID sellerId);

    @Query("SELECT d FROM Delivery d JOIN FETCH d.auction a LEFT JOIN FETCH a.imagePaths WHERE d.buyer.id = :buyerId ORDER BY d.createdAt DESC")
    List<Delivery> findByBuyerIdOrderByCreatedAtDesc(UUID buyerId);

    List<Delivery> findBySellerIdAndStatusOrderByCreatedAtDesc(UUID sellerId, String status);

    List<Delivery> findByBuyerIdAndStatusOrderByCreatedAtDesc(UUID buyerId, String status);

    @Query("SELECT d FROM Delivery d JOIN FETCH d.auction a LEFT JOIN FETCH a.imagePaths WHERE d.auction.id = :auctionId")
    Optional<Delivery> findByAuctionId(UUID auctionId);
    
    @Query("SELECT d FROM Delivery d JOIN FETCH d.auction a LEFT JOIN FETCH a.imagePaths WHERE d.id = :id")
    Optional<Delivery> findByIdWithAuction(UUID id);

    @Query("SELECT d FROM Delivery d JOIN FETCH d.auction a LEFT JOIN FETCH a.imagePaths WHERE d.seller.id = :userId OR d.buyer.id = :userId ORDER BY d.createdAt DESC")
    List<Delivery> findAllByUser(UUID userId);
}