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

    List<Delivery> findBySellerId(UUID sellerId);

    List<Delivery> findByBuyerId(UUID buyerId);

    List<Delivery> findBySellerIdAndStatus(UUID sellerId, String status);

    List<Delivery> findByBuyerIdAndStatus(UUID buyerId, String status);

    Optional<Delivery> findByAuctionId(UUID auctionId);

    @Query("SELECT d FROM Delivery d WHERE d.seller.id = :userId OR d.buyer.id = :userId")
    List<Delivery> findAllByUser(UUID userId);
}