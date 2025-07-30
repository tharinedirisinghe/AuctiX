package com.helios.auctix.services;

import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.auction.AuctionImagePath;
import com.helios.auctix.domain.delivery.Delivery;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserAddress;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.dtos.DeliveryCreateDTO;
import com.helios.auctix.dtos.DeliveryDTO;
import com.helios.auctix.dtos.DeliveryUpdateDTO;
import com.helios.auctix.repositories.AuctionImagePathsRepository;
import com.helios.auctix.repositories.AuctionRepository;
import com.helios.auctix.repositories.BidRepository;
import com.helios.auctix.repositories.DeliveryRepository;
import com.helios.auctix.repositories.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.logging.Logger;
import java.util.stream.Collectors;

@Service
public class DeliveryService {

    private final DeliveryRepository deliveryRepository;
    private final AuctionRepository auctionRepository;
    private final AuctionImagePathsRepository auctionImagePathsRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private static final Logger logger = Logger.getLogger(DeliveryService.class.getName());
    
    @Value("${auctix.backend-url}")
    private String backendUrl;
    
    public DeliveryService(DeliveryRepository deliveryRepository, 
                          AuctionRepository auctionRepository,
                          AuctionImagePathsRepository auctionImagePathsRepository,
                          UserRepository userRepository,
                          BidRepository bidRepository) {
        this.deliveryRepository = deliveryRepository;
        this.auctionRepository = auctionRepository;
        this.auctionImagePathsRepository = auctionImagePathsRepository;
        this.userRepository = userRepository;
        this.bidRepository = bidRepository;
    }

    @Transactional
    public DeliveryDTO createDelivery(DeliveryCreateDTO createDTO, User currentUser) {
        logger.info("Creating delivery for auction: " + createDTO.getAuctionId());

        Auction auction = auctionRepository.findById(createDTO.getAuctionId())
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        // Check if current user is the seller of the auction
        if (!auction.getSeller().getUser().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("Only the seller can create a delivery for this auction");
        }

        // Check if auction is completed and has a winning bid
        if (auction.getWinningBidId() == null) {
            throw new IllegalArgumentException("Cannot create delivery for an auction without a winning bid");
        }

        // Find the buyer (either specified or from the winning bid)
        User buyer;
        if (createDTO.getBuyerId() != null) {
            buyer = userRepository.findById(createDTO.getBuyerId())
                    .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));
        } else {
            // Get buyer from the winning bid
            throw new IllegalArgumentException("Buyer ID is required");
        }

        // Parse delivery date
        LocalDate deliveryDate;
        try {
            deliveryDate = LocalDate.parse(createDTO.getDeliveryDate(), DateTimeFormatter.ISO_DATE);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid delivery date format. Use YYYY-MM-DD");
        }

        // Create delivery entity
        Delivery delivery = Delivery.builder()
                .auction(auction)
                .seller(currentUser)
                .buyer(buyer)
                .deliveryDate(deliveryDate)
                .status("PACKING")
                .deliveryAddress(createDTO.getDeliveryAddress())
                .notes(createDTO.getNotes())
                .amount(auction.getStartingPrice())
                .build();

        delivery = deliveryRepository.save(delivery);

        return mapToDTO(delivery);
    }

    /**
     * Automatically create delivery after successful auction completion
     */
    @Transactional
    public DeliveryDTO createAutomaticDelivery(UUID auctionId, UUID buyerId, Double winningAmount) {
        logger.info("Creating automatic delivery for auction: " + auctionId + " with buyer: " + buyerId);

        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        User buyer = userRepository.findById(buyerId)
                .orElseThrow(() -> new IllegalArgumentException("Buyer not found"));

        User seller = auction.getSeller().getUser();

        // Check if delivery already exists for this auction
        Optional<Delivery> existingDelivery = deliveryRepository.findByAuctionId(auctionId);
        if (existingDelivery.isPresent()) {
            logger.info("Delivery already exists for auction: " + auctionId);
            return mapToDTO(existingDelivery.get());
        }

        // Get buyer's delivery address
        String deliveryAddress = getBuyerDeliveryAddress(buyer);

        // Set delivery date to 7 days from now
        LocalDate deliveryDate = LocalDate.now().plusDays(7);

        // Create delivery entity
        Delivery delivery = Delivery.builder()
                .auction(auction)
                .seller(seller)
                .buyer(buyer)
                .deliveryDate(deliveryDate)
                .status("PACKING")
                .deliveryAddress(deliveryAddress)
                .notes("Automatic delivery created after auction completion")
                .amount(winningAmount)
                .build();

        delivery = deliveryRepository.save(delivery);
        logger.info("Successfully created automatic delivery with ID: " + delivery.getId());

        return mapToDTO(delivery);
    }

    /**
     * Helper method to get buyer's full delivery address
     */
    private String getBuyerDeliveryAddress(User buyer) {
        UserAddress address = buyer.getUserAddress();
        if (address == null) {
            return "Address not provided - Please contact buyer for delivery details";
        }

        StringBuilder fullAddress = new StringBuilder();
        
        if (address.getAddressNumber() != null) {
            fullAddress.append(address.getAddressNumber()).append(", ");
        }
        if (address.getAddressLine1() != null) {
            fullAddress.append(address.getAddressLine1()).append(", ");
        }
        if (address.getAddressLine2() != null) {
            fullAddress.append(address.getAddressLine2()).append(", ");
        }
        if (address.getCity() != null) {
            fullAddress.append(address.getCity()).append(", ");
        }
        if (address.getState() != null) {
            fullAddress.append(address.getState()).append(" ");
        }
        if (address.getPostalCode() != null) {
            fullAddress.append(address.getPostalCode()).append(", ");
        }
        if (address.getCountry() != null) {
            fullAddress.append(address.getCountry());
        }

        // Clean up trailing commas and spaces
        String result = fullAddress.toString().replaceAll(",\\s*$", "").trim();
        
        return result.isEmpty() ? "Address not provided - Please contact buyer for delivery details" : result;
    }

    public List<DeliveryDTO> getAllDeliveriesForUser(User user) {
        logger.info("Fetching all deliveries for user: " + user.getId());

        List<Delivery> deliveries = deliveryRepository.findAllByUser(user.getId());

        return deliveries.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<DeliveryDTO> getAllDeliveriesForSeller(User seller) {
        logger.info("Fetching all deliveries for seller: " + seller.getId());

        // Check if user is a seller
        if (seller.getRoleEnum() != UserRoleEnum.SELLER &&
                seller.getRoleEnum() != UserRoleEnum.ADMIN &&
                seller.getRoleEnum() != UserRoleEnum.SUPER_ADMIN) {
            throw new IllegalArgumentException("User is not a seller");
        }

        List<Delivery> deliveries = deliveryRepository.findBySellerIdOrderByCreatedAtDesc(seller.getId());

        return deliveries.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public List<DeliveryDTO> getAllDeliveriesForBuyer(User buyer) {
        logger.info("Fetching all deliveries for buyer: " + buyer.getId());

        List<Delivery> deliveries = deliveryRepository.findByBuyerIdOrderByCreatedAtDesc(buyer.getId());

        return deliveries.stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public DeliveryDTO getDeliveryById(UUID id, User currentUser) {
        logger.info("Fetching delivery by ID: " + id);

        Delivery delivery = deliveryRepository.findByIdWithAuction(id)
                .orElseThrow(() -> new IllegalArgumentException("Delivery not found"));

        // Check if user is buyer or seller of the delivery
        boolean isAuthorized = delivery.getBuyer().getId().equals(currentUser.getId()) ||
                delivery.getSeller().getId().equals(currentUser.getId()) ||
                currentUser.getRoleEnum() == UserRoleEnum.ADMIN ||
                currentUser.getRoleEnum() == UserRoleEnum.SUPER_ADMIN;

        if (!isAuthorized) {
            throw new IllegalArgumentException("You are not authorized to view this delivery");
        }

        return mapToDTO(delivery);
    }

    @Transactional
    public DeliveryDTO updateDelivery(UUID id, DeliveryUpdateDTO updateDTO, User currentUser) {
        logger.info("Updating delivery: " + id);

        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Delivery not found"));

        // Check if user is seller of the delivery or admin
        boolean isAuthorized = delivery.getSeller().getId().equals(currentUser.getId()) ||
                currentUser.getRoleEnum() == UserRoleEnum.ADMIN ||
                currentUser.getRoleEnum() == UserRoleEnum.SUPER_ADMIN;

        if (!isAuthorized) {
            throw new IllegalArgumentException("Only the seller or admin can update this delivery");
        }

        // Update delivery date if provided
        if (updateDTO.getDeliveryDate() != null && !updateDTO.getDeliveryDate().isEmpty()) {
            try {
                LocalDate deliveryDate = LocalDate.parse(updateDTO.getDeliveryDate(), DateTimeFormatter.ISO_DATE);
                delivery.setDeliveryDate(deliveryDate);
            } catch (Exception e) {
                throw new IllegalArgumentException("Invalid delivery date format. Use YYYY-MM-DD");
            }
        }

        // Update status if provided
        if (updateDTO.getStatus() != null && !updateDTO.getStatus().isEmpty()) {
            // Validate status values
            String statusUpper = updateDTO.getStatus().toUpperCase();
            if (!statusUpper.equals("PACKING") && !statusUpper.equals("SHIPPING") && 
                !statusUpper.equals("DELIVERED") && !statusUpper.equals("CANCELLED")) {
                throw new IllegalArgumentException("Invalid delivery status. Must be: PACKING, SHIPPING, DELIVERED, or CANCELLED");
            }
            delivery.setStatus(statusUpper);
        }

        // Update other fields if provided
        if (updateDTO.getDeliveryAddress() != null) {
            delivery.setDeliveryAddress(updateDTO.getDeliveryAddress());
        }

        if (updateDTO.getNotes() != null) {
            delivery.setNotes(updateDTO.getNotes());
        }

        if (updateDTO.getTrackingNumber() != null) {
            delivery.setTrackingNumber(updateDTO.getTrackingNumber());
        }

        delivery = deliveryRepository.save(delivery);

        return mapToDTO(delivery);
    }

    @Transactional
    public DeliveryDTO updateDeliveryStatus(UUID id, String status, User currentUser) {
        logger.info("Updating delivery status to " + status + " for delivery: " + id);

        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Delivery not found"));

        // Check if user is seller of the delivery or admin
        boolean isAuthorized = delivery.getSeller().getId().equals(currentUser.getId()) ||
                currentUser.getRoleEnum() == UserRoleEnum.ADMIN ||
                currentUser.getRoleEnum() == UserRoleEnum.SUPER_ADMIN;

        if (!isAuthorized) {
            throw new IllegalArgumentException("Only the seller or admin can update this delivery status");
        }

        // Validate and update status
        String statusUpper = status.toUpperCase();
        if (!statusUpper.equals("PACKING") && !statusUpper.equals("SHIPPING") && 
            !statusUpper.equals("DELIVERED") && !statusUpper.equals("CANCELLED")) {
            throw new IllegalArgumentException("Invalid delivery status. Must be: PACKING, SHIPPING, DELIVERED, or CANCELLED");
        }
        
        delivery.setStatus(statusUpper);
        delivery = deliveryRepository.save(delivery);

        return mapToDTO(delivery);
    }

    @Transactional
    public DeliveryDTO updateDeliveryDate(UUID id, String dateStr, User currentUser) {
        logger.info("Updating delivery date for delivery: " + id);

        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Delivery not found"));

        // Check if user is seller of the delivery or admin
        boolean isAuthorized = delivery.getSeller().getId().equals(currentUser.getId()) ||
                currentUser.getRoleEnum() == UserRoleEnum.ADMIN ||
                currentUser.getRoleEnum() == UserRoleEnum.SUPER_ADMIN;

        if (!isAuthorized) {
            throw new IllegalArgumentException("Only the seller or admin can update this delivery date");
        }

        // Parse and update delivery date
        try {
            LocalDate deliveryDate = LocalDate.parse(dateStr, DateTimeFormatter.ISO_DATE);
            delivery.setDeliveryDate(deliveryDate);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid delivery date format. Use YYYY-MM-DD");
        }

        delivery = deliveryRepository.save(delivery);

        return mapToDTO(delivery);
    }

    @Transactional
    public void deleteDelivery(UUID id, User currentUser) {
        logger.info("Deleting delivery: " + id);

        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Delivery not found"));

        // Check if user is seller of the delivery or admin
        boolean isAuthorized = delivery.getSeller().getId().equals(currentUser.getId()) ||
                currentUser.getRoleEnum() == UserRoleEnum.ADMIN ||
                currentUser.getRoleEnum() == UserRoleEnum.SUPER_ADMIN;

        if (!isAuthorized) {
            throw new IllegalArgumentException("Only the seller or admin can delete this delivery");
        }

        deliveryRepository.delete(delivery);
    }

    @Transactional
    public DeliveryDTO requestAddress(UUID id, User currentUser) {
        logger.info("Requesting address for delivery: " + id);

        Delivery delivery = deliveryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Delivery not found"));

        // Check if user is seller of the delivery or admin
        boolean isAuthorized = delivery.getSeller().getId().equals(currentUser.getId()) ||
                currentUser.getRoleEnum() == UserRoleEnum.ADMIN ||
                currentUser.getRoleEnum() == UserRoleEnum.SUPER_ADMIN;

        if (!isAuthorized) {
            throw new IllegalArgumentException("Only the seller or admin can request address for this delivery");
        }

        // Set address requested flag
        delivery.setAddressRequested(true);
        delivery = deliveryRepository.save(delivery);

        return mapToDTO(delivery);
    }

    // Helper method to map Delivery entity to DeliveryDTO
    private DeliveryDTO mapToDTO(Delivery delivery) {
        DeliveryDTO dto = DeliveryDTO.builder()
                .id(delivery.getId())
                .auctionId(delivery.getAuction().getId())
                .auctionTitle(delivery.getAuction().getTitle())
                .sellerId(delivery.getSeller().getId())
                .sellerName(delivery.getSeller().getUsername())
                .buyerId(delivery.getBuyer().getId())
                .buyerName(delivery.getBuyer().getUsername())
                .deliveryDate(delivery.getDeliveryDate())
                .status(delivery.getStatus())
                .deliveryAddress(delivery.getDeliveryAddress())
                .notes(delivery.getNotes())
                .amount(delivery.getAmount())
                .trackingNumber(delivery.getTrackingNumber())
                .addressRequested(delivery.getAddressRequested())
                .createdAt(delivery.getCreatedAt())
                .updatedAt(delivery.getUpdatedAt())
                .build();

        // Try to get buyer address from user address table if available
        UserAddress buyerAddress = delivery.getBuyer().getUserAddress();
        if (buyerAddress != null) {
            // Set buyer location
            dto.setBuyerLocation(buyerAddress.getCity() + ", " + buyerAddress.getCountry());
            
            // If delivery doesn't have address or has placeholder text, use buyer's actual address
            if (delivery.getDeliveryAddress() == null || 
                delivery.getDeliveryAddress().contains("Address not provided") ||
                delivery.getDeliveryAddress().trim().isEmpty()) {
                
                String fullAddress = getBuyerDeliveryAddress(delivery.getBuyer());
                dto.setDeliveryAddress(fullAddress);
            }
        }

        // Try to get auction image if available
        logger.info("Checking auction images for delivery: " + delivery.getId());
        if (delivery.getAuction() != null) {
            logger.info("Auction found: " + delivery.getAuction().getId());
            List<AuctionImagePath> imagePaths = auctionImagePathsRepository.findById_AuctionId(delivery.getAuction().getId());
            logger.info("Found " + imagePaths.size() + " image paths from repository");
            if (!imagePaths.isEmpty()) {
                // Create list of all image URLs
                List<String> allImageUrls = new ArrayList<>();
                for (AuctionImagePath imagePath : imagePaths) {
                    String imageUrl = backendUrl + "/auctions/getAuctionImages?file_uuid=" + imagePath.getImageId().toString();
                    allImageUrls.add(imageUrl);
                }
                
                // Set all images
                dto.setAuctionImages(allImageUrls);
                
                // Set first image for backward compatibility
                dto.setAuctionImage(allImageUrls.get(0));
                
                logger.info("Setting " + allImageUrls.size() + " auction image URLs. First image: " + allImageUrls.get(0));
            } else {
                logger.info("No image paths found for auction: " + delivery.getAuction().getId());
            }
        } else {
            logger.info("Auction is null");
        }

        // Get auction category if available
        dto.setAuctionCategory(delivery.getAuction().getCategory());

        return dto;
    }

//    private String getBuyerDeliveryAddress(User buyer) {
//        UserAddress address = buyer.getUserAddress();
//        if (address == null) {
//            return "Address not provided";
//        }
//
//        StringBuilder addressBuilder = new StringBuilder();
//
//        if (address.getAddressNumber() != null && !address.getAddressNumber().trim().isEmpty()) {
//            addressBuilder.append(address.getAddressNumber()).append(" ");
//        }
//
//        if (address.getAddressLine1() != null && !address.getAddressLine1().trim().isEmpty()) {
//            addressBuilder.append(address.getAddressLine1());
//        }
//
//        if (address.getAddressLine2() != null && !address.getAddressLine2().trim().isEmpty()) {
//            addressBuilder.append(", ").append(address.getAddressLine2());
//        }
//
//        if (address.getCity() != null && !address.getCity().trim().isEmpty()) {
//            addressBuilder.append(", ").append(address.getCity());
//        }
//
//        if (address.getState() != null && !address.getState().trim().isEmpty()) {
//            addressBuilder.append(", ").append(address.getState());
//        }
//
//        if (address.getPostalCode() != null && !address.getPostalCode().trim().isEmpty()) {
//            addressBuilder.append(" ").append(address.getPostalCode());
//        }
//
//        if (address.getCountry() != null && !address.getCountry().trim().isEmpty()) {
//            addressBuilder.append(", ").append(address.getCountry());
//        }
//
//        String fullAddress = addressBuilder.toString().replaceAll("^,\\s*", "").trim();
//        return fullAddress.isEmpty() ? "Address not provided" : fullAddress;
//    }

}