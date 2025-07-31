package com.helios.auctix.repositories;

import com.helios.auctix.domain.auction.AuctionDeletionRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AuctionDeletionRequestRepository extends JpaRepository<AuctionDeletionRequest, UUID> {
    Optional<AuctionDeletionRequest> findByAuctionIdAndStatus(UUID auctionId, String status);
    List<AuctionDeletionRequest> findBySellerIdAndStatus(UUID sellerId, String status);
}
