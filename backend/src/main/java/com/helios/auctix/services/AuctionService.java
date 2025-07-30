package com.helios.auctix.services;

import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.auction.AuctionDeletionRequest;
import com.helios.auctix.domain.auction.AuctionImagePath;
import com.helios.auctix.domain.chat.ChatRoom;
import com.helios.auctix.dtos.*;
import com.helios.auctix.mappers.impl.SellerMapperImpl;
import com.helios.auctix.mappers.impl.UserMapperImpl;
import com.helios.auctix.repositories.AuctionDeletionRequestRepository;
import com.helios.auctix.repositories.AuctionImagePathsRepository;

import java.util.Arrays;
import java.util.logging.Logger;
import com.helios.auctix.repositories.AuctionRepository;

import com.helios.auctix.repositories.chat.ChatRoomRepository;
import com.helios.auctix.services.fileUpload.FileUploadResponse;
import com.helios.auctix.services.fileUpload.FileUploadService;
import com.helios.auctix.services.fileUpload.FileUploadUseCaseEnum;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import java.util.UUID;

//import static com.helios.auctix.services.fileUpload.FileUploadService.log;

@AllArgsConstructor
@Service
public class AuctionService {

    private final AuctionRepository auctionRepository; // Updated repository
    private final AuctionImagePathsRepository auctionImagePathsRepository; // <-- Add this
    private final SellerMapperImpl sellerMapper;
    private final UserMapperImpl userMapperImpl;
    private final BidService bidService;
    private final ChatRoomRepository chatRoomRepository;
    @Autowired
    private FileUploadService uploader;
    private AuctionDeletionRequestRepository deletionRequestRepository;
    private static final Logger log = Logger.getLogger(AuctionService.class.getName());


    public AuctionDetailsDTO getAuctionDetails(UUID id) {
        try {Auction auction = auctionRepository.findById(id).orElse(null);
        if (auction == null) return null;

        List<String> imageIds = auctionImagePathsRepository.findById_AuctionId(id)
                .stream()
                .map(AuctionImagePath::getImageId)
                .map(UUID::toString)
                .collect(Collectors.toList());

       UserDTO sellerDto = userMapperImpl.mapTo(auction.getSeller().getUser());

        // Fetch bid history and highest bid
        List<BidDTO> bidHistory = bidService.getBidHistoryForAuction(id)
                .stream()
                .map(bidService::convertToDTO)
                .toList();

        BidDTO highestBid = bidService.getHighestBidForAuction(id)
                .map(bidService::convertToDTO)
                .orElse(null);


        return AuctionDetailsDTO.builder().seller(sellerDto)
                .id(auction.getId().toString())
                .category(auction.getCategory())
                .title(auction.getTitle())
                .description(auction.getDescription())
                .images(imageIds) // <-- Only image IDs
                .endTime(auction.getEndTime().toString())
                .startTime(auction.getStartTime().toString())
                .bidHistory(bidHistory)
                .currentHighestBid(highestBid)
                .startingPrice(auction.getStartingPrice())
                .isDeleted(auction.isDeleted()) // Fixed: removed 'set' prefix
                .deletionStatus(auction.getDeletionStatus()) // ADD this line
//                .status(auction.getStatus() != null ? auction.getStatus().toString() : null) // ADD this line
                .build();
    }  catch (Exception e) {
//        log.error("Database error when finding auction: " + id, e);
        throw e;
    }
    }

    public Auction createAuction(Auction auction) {
        try {
        // Validate required fields
        if (auction.getTitle() == null || auction.getTitle().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }

        // Validate title length and word count
        String[] words = auction.getTitle().trim().split("\\s+");
        if (words.length < 5) {
            throw new IllegalArgumentException("Title must be at least 5 words long");
        }

        if (auction.getTitle().length() > 100) {
            throw new IllegalArgumentException("Title cannot exceed 100 characters");
        }

        if (auction.getDescription() == null || auction.getDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Description is required");
        }

        if (auction.getDescription().length() < 20) {
            throw new IllegalArgumentException("Description must be at least 20 characters long");
        }

        if (auction.getDescription().length() > 1000) {
            throw new IllegalArgumentException("Description cannot exceed 1000 characters");
        }

        if (auction.getStartingPrice() <= 0) {
            throw new IllegalArgumentException("Starting price must be greater than 0");
        }

        if (auction.getStartingPrice() > 10000000) {
            throw new IllegalArgumentException("Starting price cannot exceed 10,000,000 LKR");
        }

        if (auction.getStartTime() == null || auction.getEndTime() == null) {
            throw new IllegalArgumentException("Start time and end time are required");
        }

        if (auction.getStartTime().isAfter(auction.getEndTime())) {
            throw new IllegalArgumentException("Start time must be before end time");
        }

        if (auction.getCategory() == null || auction.getCategory().trim().isEmpty()) {
            throw new IllegalArgumentException("Category is required");
        }

        if (auction.getImagePaths() == null || auction.getImagePaths().isEmpty()) {
            throw new IllegalArgumentException("At least one image is required");
        }

        // Set timestamps
        auction.setCreatedAt(Instant.now());
        auction.setUpdatedAt(Instant.now());

        Auction savedAuction = auctionRepository.save(auction);

        // Create a chat-room for the auction and add the seller to the chat
        try {
            createChatRoomForAuction(savedAuction);
        } catch (Exception e) {
            log.warning("Failed to create chat room for auction: " + e.getMessage());
            // Don't fail the auction creation if chat room creation fails
        }

        return savedAuction;

    } catch (IllegalArgumentException e) {
        // Re-throw validation errors
        throw e;
    } catch (Exception e) {
        log.severe("Error creating auction in service: " + e.getMessage());
        throw new RuntimeException("Failed to create auction: " + e.getMessage(), e);
    }
    }


    public Page<Auction> getActiveAuctionsPaged(String category, String tsQuery, int page, int limit) {
        Instant now = Instant.now();
        Pageable pageable = PageRequest.of(page - 1, limit);
        return auctionRepository.findActiveAuctionsPaged(now, category, tsQuery, pageable);
    }



    public Page<Auction> getUpcomingAuctionsPaged(String category, String tsQuery, int page, int limit) {
        Instant now = Instant.now();
        Pageable pageable = PageRequest.of(page - 1, limit);
        return auctionRepository.findUpcomingAuctionsPaged(now, category, tsQuery, pageable);
    }


    public Page<Auction> getExpiredAuctionsPaged(String category, String tsQuery, int page, int limit) {
        Instant now = Instant.now();
        Instant threeDaysAgo = now.minus(3, ChronoUnit.DAYS);
        Pageable pageable = PageRequest.of(page - 1, limit);
        return auctionRepository.findExpiredAuctionsPaged(now, threeDaysAgo, category, tsQuery, pageable);
    }


    public Page<Auction> getAllAuctionsPaged(String category, String tsQuery, int page, int limit) {
        Pageable pageable = PageRequest.of(page - 1, limit);
        return auctionRepository.findAllPaged(category, tsQuery, pageable); // ✅ Match new repo method
    }


    public String buildTsQuery(String searchQuery) {
        if (searchQuery == null || searchQuery.trim().isEmpty()) return null;
        return Arrays.stream(searchQuery.trim().split("\\s+"))
                .map(word -> word + ":*")
                .collect(Collectors.joining(" & "));
    }









//    public List<Auction> getAllAuctions() {
//        return auctionRepository.findAllPublicAuctions(); // Use the new method
//
//    }



    // Get currently running auctions (started and not ended)
//    public List<Auction> getActiveAuctions() {
//        Instant now = Instant.now();
//        return auctionRepository.findActiveAuctions(now);
//    }
//
//    // Get available auctions (not yet ended - includes future auctions)
//    public List<Auction> getAvailableAuctions() {
//        Instant now = Instant.now();
//        return auctionRepository.findAvailableAuctions(now);
//    }
//
//    // Get upcoming auctions (future auctions)
//    public List<Auction> getUpcomingAuctions() {
//        Instant now = Instant.now();
//        return auctionRepository.findUpcomingAuctions(now);
//    }
//
//    // Get expired auctions from the last 3 days
//    public List<Auction> getExpiredAuctions() {
//        Instant now = Instant.now();
//        Instant threeDaysAgo = now.minus(3, ChronoUnit.DAYS);
//        return auctionRepository.findExpiredAuctions(now, threeDaysAgo);
//    }


//    public List<AuctionDetailsDTO> getActiveAuctionsDTO(String category) {
//        return getActiveAuctions().stream()
//                .filter(auction -> category == null || category.isEmpty() || auction.getCategory().equalsIgnoreCase(category))
//                .map(this::convertToDTO)
//                .collect(Collectors.toList());
//    }
//
//    public List<AuctionDetailsDTO> getUpcomingAuctionsDTO(String category) {
//        return getUpcomingAuctions().stream()
//                .filter(auction -> category == null || category.isEmpty() || auction.getCategory().equalsIgnoreCase(category))
//                .map(this::convertToDTO)
//                .collect(Collectors.toList());
//    }
//
//    public List<AuctionDetailsDTO> getExpiredAuctionsDTO(String category) {
//        return getExpiredAuctions().stream()
//                .filter(auction -> category == null || category.isEmpty() || auction.getCategory().equalsIgnoreCase(category))
//                .map(this::convertToDTO)
//                .collect(Collectors.toList());
//    }
//
//    public List<AuctionDetailsDTO> getAllAuctionsDTO(String category) {
//        return getAllAuctions().stream()
//                .filter(auction -> category == null || category.isEmpty() || auction.getCategory().equalsIgnoreCase(category))
//                .map(this::convertToDTO)
//                .collect(Collectors.toList());
//    }

    // Helper method to convert Auction entity to AuctionDetailsDTO (package private so other services can use)
    public AuctionDetailsDTO convertToDTO(Auction auction) {
        List<String> imageIds = auctionImagePathsRepository.findById_AuctionId(auction.getId())
                .stream()
                .map(AuctionImagePath::getImageId)
                .map(UUID::toString)
                .collect(Collectors.toList());

        UserDTO sellerDto = userMapperImpl.mapTo(auction.getSeller().getUser());

        // For list view, we don't need full bid history, just the highest bid
        BidDTO highestBid = bidService.getHighestBidForAuction(auction.getId())
                .map(bidService::convertToDTO)
                .orElse(null);

        return AuctionDetailsDTO.builder()
                .seller(sellerDto)
                .id(auction.getId().toString())
                .category(auction.getCategory())
                .title(auction.getTitle())
                .description(auction.getDescription())
                .images(imageIds)
                .endTime(auction.getEndTime().toString())
                .startTime(auction.getStartTime().toString())
//                .bidHistory(null) // Don't load full history for list view
                .currentHighestBid(highestBid)
                .startingPrice(auction.getStartingPrice())
                .build();
    }


    private void createChatRoomForAuction(Auction auction) {
        ChatRoom chatRoom = ChatRoom.builder()
                .auction(auction)
                .build();

        ChatRoom savedChatRoom = chatRoomRepository.save(chatRoom);

        if (auction.getSeller() != null) {
            chatRoomRepository.addUserToChatRoom(savedChatRoom.getId(), auction.getSeller().getId());
        }
    }

    // Add these new methods to your existing AuctionService

    /**
     * Get all auctions for a specific seller with filtering
     */
    public Page<AuctionDetailsDTO> getDetailedSellerAuctions(UUID sellerId, String filter, String searchTerm, Pageable pageable) {
        // 1. Fetch all auctions for the seller
        List<Auction> allAuctions = auctionRepository.findBySellerId(sellerId);

// 2. Filter by status (total, active, ended, etc.)
        List<Auction> filtered = filterAuctionsByStatus(allAuctions, filter);

// 3. Search term filter
        if (searchTerm != null && !searchTerm.trim().isEmpty()) {
            String lowered = searchTerm.toLowerCase();
            filtered = filtered.stream()
                    .filter(auction -> auction.getTitle().toLowerCase().contains(lowered) ||
                            auction.getId().toString().toLowerCase().contains(lowered))
                    .collect(Collectors.toList());
        }

// 4. Enrich with current bid & status
        List<AuctionDetailsDTO> enriched = filtered.stream()
                .map(auction -> getAuctionDetails(auction.getId()))
                .collect(Collectors.toList());

// 5. Manual pagination
        int start = Math.toIntExact(pageable.getOffset());
        int end = Math.min(start + pageable.getPageSize(), enriched.size());
        List<AuctionDetailsDTO> paged = enriched.subList(start, end);

        return new PageImpl<>(paged, pageable, enriched.size());

    }




    /**
     * Get auction statistics for a seller - Updated to match new filter logic
     */
    public SellerAuctionStatsDTO getSellerAuctionStats(UUID sellerId) {
        List<Auction> allAuctions = auctionRepository.findBySellerId(sellerId);
        Instant now = Instant.now();

        // Calculate stats using the same logic as filtering
        int totalAuctions = (int) allAuctions.stream()
                .filter(a -> !a.isDeleted())
                .count();

        int activeAuctions = (int) allAuctions.stream()
                .filter(a -> a.getStartTime().isBefore(now) &&
                        a.getEndTime().isAfter(now) &&
                        a.isPublic() &&
                        !a.isDeleted())
                .count();

        int upcomingAuctions = (int) allAuctions.stream()
                .filter(a -> a.getStartTime().isAfter(now) &&
                        a.isPublic() &&
                        !a.isDeleted())
                .count();

        int endedAuctions = (int) allAuctions.stream()
                .filter(a -> a.getEndTime().isBefore(now) &&
                        !a.isDeleted())
                .count();

        int unlistedAuctions = (int) allAuctions.stream()
                .filter(a -> (!a.isPublic() && !a.isDeleted()) ||
                        "PENDING_ADMIN_APPROVAL".equals(a.getDeletionStatus()))
                .count();

        int deletedAuctions = (int) allAuctions.stream()
                .filter(a -> a.isDeleted() && "DELETED".equals(a.getDeletionStatus()))
                .count();


        return SellerAuctionStatsDTO.builder()
                .totalAuctions(totalAuctions)
                .ongoingAuctions(activeAuctions)    // Maps to active in frontend
                .upcomingAuctions(upcomingAuctions)
                .completedAuctions(endedAuctions)   // Maps to ended in frontend
                .unlistedAuctions(unlistedAuctions)
                .deletedAuctions(deletedAuctions)
                .build();
    }

    /**
     * Update an auction with bid restrictions
     */
    public Auction updateAuction(UUID auctionId, AuctionUpdateRequestDTO updateRequest, boolean hasBids) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        // If auction has bids, only allow description updates
        if (hasBids) {
            // Only update description and add edited timestamp
            auction.setDescription(updateRequest.getDescription() + "\n\n[Edited on: " + Instant.now().toString() + "]");
//            auction.setIsPublic(updateRequest.isPublic()); // Allow visibility changes
        } else {
            // Full update allowed if no bids
            auction.setTitle(updateRequest.getTitle());
            auction.setDescription(updateRequest.getDescription());
            auction.setStartingPrice(updateRequest.getStartingPrice());
            auction.setCategory(updateRequest.getCategory());
            auction.setIsPublic(updateRequest.isPublic());

            // Parse dates
            try {
                Instant startInstant = Instant.parse(updateRequest.getStartTime());
                Instant endInstant = Instant.parse(updateRequest.getEndTime());
                auction.setStartTime(startInstant);
                auction.setEndTime(endInstant);
            } catch (DateTimeParseException e) {
                throw new IllegalArgumentException("Invalid date format");
            }

            // Handle image updates if provided
            if (updateRequest.getImages() != null && !updateRequest.getImages().isEmpty()) {
                List<UUID> imagePaths = updateRequest.getImages().stream()
                        .map(this::saveImage)
                        .collect(Collectors.toList());
                auction.setImagePaths(imagePaths);
            }
        }

        auction.setUpdatedAt(Instant.now());
        return auctionRepository.save(auction);
    }

    /**
     * Delete an auction with bid restrictions
     */
    @Transactional
    public String deleteAuction(UUID auctionId, boolean hasBids, String deletionReason, UUID sellerId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        // Check if auction is ending within 1 hour
        Instant now = Instant.now();
        Instant endTime = auction.getEndTime(); // or auction.getEnd(), based on your model

        if (endTime != null) {
            long timeDifferenceMillis = endTime.toEpochMilli() - now.toEpochMilli();
            long timeDifferenceHours = timeDifferenceMillis / (1000 * 60 * 60);
            if (timeDifferenceMillis > 0 && timeDifferenceHours < 1) {
                throw new IllegalStateException("Cannot delete auction within the last hour of its end time.");
            }
        }

        if (hasBids) {
            try {
                // Store deletion reason
                AuctionDeletionRequest deletionRequest = new AuctionDeletionRequest();
                deletionRequest.setAuctionId(auctionId);
                deletionRequest.setSellerId(sellerId);
                deletionRequest.setDeletionReason(deletionReason);
                deletionRequest.setStatus("PROCESSED"); // Mark as processed since we're deleting immediately
                deletionRequest.setProcessedAt(Instant.now());
                deletionRequestRepository.save(deletionRequest);

                // Unfreeze all bid amounts for this auction - critical operation
                bidService.unfreezeAllBidsForAuction(auctionId);

                // Delete the auction immediately - only after successful fund unfreezing
                auction.setDeleted(true);
                auction.setDeletedAt(Instant.now());
                auction.setDeletionStatus("DELETED");
                auction.setIsPublic(false);
                auction.setUpdatedAt(Instant.now());
                auctionRepository.save(auction);

                return "Auction deleted successfully. All bid amounts have been unfrozen.";
            } catch (Exception e) {
                log.severe("Failed to delete auction with bids: " + e.getMessage());
                throw new IllegalStateException("Failed to delete auction and unfreeze bid amounts: " + e.getMessage());
            }
        } else {
            // If no bids, soft delete immediately (no reason required)
            auction.setDeleted(true);
            auction.setDeletedAt(Instant.now());
            auction.setDeletionStatus("DELETED");
            auction.setUpdatedAt(Instant.now());
            auctionRepository.save(auction);

            return "Auction deleted successfully";
        }
    }

    public String approveAuctionDeletion(UUID auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        if (!"PENDING_ADMIN_APPROVAL".equals(auction.getDeletionStatus())) {
            throw new IllegalStateException("Auction is not pending deletion approval");
        }

        // Now actually delete the auction
        auction.setDeleted(true);
        auction.setDeletedAt(Instant.now());
        auction.setDeletionStatus("DELETED");
        auction.setUpdatedAt(Instant.now());
        auctionRepository.save(auction);

        return "Auction deletion approved and completed";
    }

    // Updated getAuctionForUpdate method in AuctionService.java

    public AuctionUpdateFormDTO getAuctionForUpdate(UUID auctionId, UUID sellerId) {
        log.info("=== BACKEND DEBUG - getAuctionForUpdate ===");
        log.info("Starting getAuctionForUpdate for auction: " + auctionId);

        Auction auction = auctionRepository.findById(auctionId).orElse(null);
        log.info("Found auction: " + (auction != null));

        if (auction == null || !auction.getSeller().getId().equals(sellerId)) {
            log.warning("Auction not found or seller mismatch");
            return null;
        }

        log.info("Fetching image paths...");
        List<String> imageIds = auctionImagePathsRepository.findById_AuctionId(auctionId)
                .stream()
                .map(AuctionImagePath::getImageId)
                .map(UUID::toString)
                .collect(Collectors.toList());

        log.info("Checking for bids...");
        boolean hasBids = bidService.hasAuctionReceivedBids(auctionId);

        // CRITICAL: Ensure boolean values are properly handled
        boolean isPublicValue = auction.isPublic();
        boolean canFullyEditValue = !hasBids;

        log.info("=== BACKEND BOOLEAN VALUES ===");
        log.info("Raw auction.isPublic(): " + isPublicValue);
        log.info("isPublic type: " + ((Object) isPublicValue).getClass().getSimpleName());
        log.info("hasBids: " + hasBids);
        log.info("canFullyEdit: " + canFullyEditValue);

        log.info("Building response DTO...");
        AuctionUpdateFormDTO dto = AuctionUpdateFormDTO.builder()
                .id(auction.getId().toString())
                .title(auction.getTitle())
                .description(auction.getDescription())
                .startingPrice(auction.getStartingPrice())
                .startTime(auction.getStartTime().toString())
                .endTime(auction.getEndTime().toString())
                .isPublic(isPublicValue) // Explicitly use boolean variable
                .category(auction.getCategory())
                .images(imageIds)
                .hasBids(hasBids)
                .canFullyEdit(canFullyEditValue) // Explicitly use boolean variable
                .build();

        // VERIFY DTO values before returning
        log.info("=== DTO VERIFICATION ===");
        log.info("DTO isPublic(): " + dto.isPublic());
        log.info("DTO canFullyEdit(): " + dto.isCanFullyEdit());
        log.info("DTO hasBids(): " + dto.isHasBids());

        return dto;
    }

    /**
     * Get auction by ID (helper method)
     */
    public Auction getAuctionById(UUID id) {
        return auctionRepository.findById(id).orElse(null);
    }

    /**
     * Filter auctions by status - Updated logic
     */
    private List<Auction> filterAuctionsByStatus(List<Auction> auctions, String filter) {
        Instant now = Instant.now();

        switch (filter.toLowerCase()) {
            case "ongoing":
            case "active":
                // Active auctions: started but not ended, public, and not deleted
                return auctions.stream()
                        .filter(a -> a.getStartTime().isBefore(now) &&
                                a.getEndTime().isAfter(now) &&
                                a.isPublic() &&
                                !a.isDeleted())
                        .collect(Collectors.toList());

            case "upcoming":
                // Upcoming auctions: start time is in the future, public, and not deleted
                return auctions.stream()
                        .filter(a -> a.getStartTime().isAfter(now) &&
                                a.isPublic() &&
                                !a.isDeleted())
                        .collect(Collectors.toList());

            case "completed":
            case "ended":
                // Ended auctions: end time is in the past, not deleted
                return auctions.stream()
                        .filter(a -> a.getEndTime().isBefore(now) &&
                                !a.isDeleted())
                        .collect(Collectors.toList());

            case "unlisted":
                // Unlisted auctions: not public and not deleted
                // Note: With new flow, no more "PENDING_ADMIN_APPROVAL" since we delete immediately
                return auctions.stream()
                        .filter(a -> !a.isPublic() && !a.isDeleted())
                        .collect(Collectors.toList());


            case "deleted":
                // Deleted auctions: all auctions that are marked as deleted
                // With new flow, we delete immediately so check isDeleted flag
                return auctions.stream()
                        .filter(a -> a.isDeleted())
                        .collect(Collectors.toList());


            case "total":
            default:
                // Total auctions: all auctions except deleted ones
                return auctions.stream()
                        .filter(a -> !a.isDeleted())
                        .collect(Collectors.toList());
        }
    }

    /**
     * Convert auction to seller auction DTO
     */
    private SellerAuctionDTO convertToSellerAuctionDTO(Auction auction) {
        Instant now = Instant.now();

        String status;
        if (auction.isDeleted()) {
            status = "deleted";
        } else {
            status = determineAuctionStatus(auction, now);
        }

        // Get current bid count and highest bid
        int bidCount = bidService.getBidCountForAuction(auction.getId());
        BidDTO highestBid = bidService.getHighestBidForAuction(auction.getId())
                .map(bidService::convertToDTO)
                .orElse(null);

        double currentBid = (highestBid != null) ? highestBid.getAmount() : auction.getStartingPrice();

        return SellerAuctionDTO.builder()
                .id(auction.getId().toString())
                .title(auction.getTitle())
                .startTime(auction.getStartTime().toString())
                .endTime(auction.getEndTime().toString())
                .startingPrice(auction.getStartingPrice())
                .currentBid(currentBid)
                .bidCount(bidCount)
                .status(status)
                .isPublic(auction.isPublic())
                .isDeleted(auction.isDeleted())
                .deletionStatus(auction.getDeletionStatus())
                .createdAt(auction.getCreatedAt().toString())
                .updatedAt(auction.getUpdatedAt() != null ? auction.getUpdatedAt().toString() : null)
                .build();
    }

    /**
     * Determine auction status - Updated logic
     */
    private String determineAuctionStatus(Auction auction, Instant now) {
        if (auction.isDeleted()) {
            return auction.getDeletionStatus() != null ?
                    auction.getDeletionStatus() : "DELETED";
        }

        if (!auction.isPublic()) {
            return "UNLISTED";
        }

        // Compare times with server time
        if (auction.getStartTime().isAfter(now)) {
            return "UPCOMING";
        } else if (auction.getEndTime().isBefore(now) || auction.getEndTime().equals(now)) {
            return "ENDED";
        } else {
            return "ONGOING";  // Started but not ended
        }
    }

    /**
     * Helper method to save image (reuse existing method)
     */
    private UUID saveImage(MultipartFile image) {
        try {
            FileUploadResponse uploadRes = uploader.uploadFile(image, FileUploadUseCaseEnum.AUCTION_IMAGE);
            if (uploadRes.isSuccess()) {
                return uploadRes.getUpload().getId();
            } else {
                throw new RuntimeException("Failed to upload image: " + uploadRes.getMessage());
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to save image: " + e.getMessage());
        }
    }


    public List<Auction> searchAuctions(String searchTerm) {
        String tsQuery = buildTsQuery(searchTerm);
        if (tsQuery == null) {
            return auctionRepository.findAll();
        }
        return auctionRepository.searchByFullText(tsQuery);
    }

    /**
     * Builds a PostgreSQL full-text search query (`tsquery`) from a raw search string.
     * <p>
     * This method:
     * <ul>
     *   <li>Removes all non-alphanumeric characters except whitespace</li>
     *   <li>Splits the cleaned string into words</li>
     *   <li>Appends <code>:*</code> to each word to enable prefix matching</li>
     *   <li>Joins all words using <code>&</code> for logical AND</li>
     * </ul>
     * <p>
     * Example: <code>"vintage toy"</code> becomes <code>"vintage:* & toy:*"</code>
     *
     * @param searchTerm the raw user input search string; can be null or blank
     * @return a formatted tsquery string for use in PostgreSQL's <code>to_tsquery</code>, or null if input is null/blank
     */
//    private String buildTsQuery(String searchTerm) {
//        if (searchTerm == null || searchTerm.isBlank()) {
//            return null;
//        }
//
//        String sanitized = searchTerm.replaceAll("[^\\w\\s]", "");
//        // E.g. Convert: "vint toy car" => "vint:* & toy:* & car:*"
//        return Arrays.stream(sanitized.trim().split("\\s+"))
//                .map(word -> word + ":*") // append :* for prefix matching
//                .collect(Collectors.joining(" & "));
//    }



}