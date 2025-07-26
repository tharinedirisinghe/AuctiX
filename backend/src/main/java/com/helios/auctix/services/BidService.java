package com.helios.auctix.services;

import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.auction.Bid;
import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.dtos.*;
import com.helios.auctix.events.notification.NotificationEventPublisher;
import com.helios.auctix.services.user.UserDetailsService;
import com.helios.auctix.mappers.impl.UserMapperImpl;
import com.helios.auctix.repositories.AuctionRepository;
import com.helios.auctix.repositories.BidRepository;
import com.helios.auctix.repositories.UserRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;


@AllArgsConstructor
@Service
public class BidService {

    private final BidRepository bidRepository;
    private final AuctionRepository auctionRepository;
    private final CoinTransactionService transactionService;
    private final UserDetailsService userDetailsService;
    private static final Logger log = Logger.getLogger(BidService.class.getName());
    private final UserMapperImpl userMapperImpl;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationEventPublisher notificationEventPublisher;
    private final WatchListNotifyService watchListNotifyService;
    private final WatchListService watchListService;

    // Get bid history for an auction
    public List<Bid> getBidHistoryForAuction(UUID auctionId) {
        return bidRepository.findByAuctionIdOrderByBidTimeDesc(auctionId)
                .stream()
                .limit(10)
                .toList();
    }

    // Get the highest bid for an auction
    public Optional<Bid> getHighestBidForAuction(UUID auctionId) {
        return bidRepository.findTopByAuctionIdOrderByAmountDesc(auctionId);
    }

    // Add this method to get bidder details
    public BidDTO convertToDTO(Bid bid) {

        User bidder = userRepository.findById(bid.getBidderId()).orElse(null);

        UserDTO bidderDto = userMapperImpl.mapTo(bidder);


        return BidDTO.builder()
                .id(bid.getId())
                .auctionId(bid.getAuction().getId())
                .auctionTitle(bid.getAuction().getTitle())
                .bidderId(bid.getBidderId())
                .bidderName(bid.getBidderName())
                .bidderAvatar(bid.getBidderAvatar())
                .amount(bid.getAmount())
                .bidTime(bid.getBidTime())
                .createdAt(bid.getCreatedAt())
                .bidder(bidderDto) // ✅ include full bidder
                .build();
    }

    // Method for placing a new bid
    @Transactional
    public BidDTO placeBid(PlaceBidRequest request, User bidder) {

        UUID auctionId = request.getAuctionId();
        Double amount = request.getAmount();
        List<User> excludedFromWatchlistNotify = new ArrayList<>();

        UUID bidderId = bidder.getId();
        String bidderName = bidder.getFirstName() + " " + bidder.getLastName();
        UUID bidderAvatar = null;
        if(bidder.getUpload()!=null){
            bidderAvatar = bidder.getUpload().getId();
        }


        // Find the auction given through request
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found"));

        UserRoleEnum userRole = bidder.getRoleEnum();
        if (userRole != UserRoleEnum.BIDDER) {
            throw new SecurityException("Only registered bidders can place bids on auctions");
        }

        // Additional check: Prevent sellers from bidding on their own auctions
        if (auction.getSeller().getId().equals(bidderId)) {
            throw new SecurityException("You cannot bid on your own auction");
        }

        // Check if auction is active
        Instant now = Instant.now();
        if (now.isBefore(auction.getStartTime())) {
            throw new IllegalStateException("Auction has not started yet");
        }
        if (now.isAfter(auction.getEndTime())) {
            throw new IllegalStateException("Auction has already ended");
        }

        // Validate bid amount format and value
        if (amount == null || amount <= 0) {
            throw new IllegalArgumentException("Bid amount must be a positive number");
        }

        // Check for reasonable bid limits (prevent extremely large bids)
        if (amount > 100_000_000) { // 100 million limit - adjust as needed
            throw new IllegalArgumentException("Bid amount exceeds maximum allowed limit");
        }

        // Set bidTime server-side
        Instant bidTime = Instant.now(); // 🚀 Always use server time

        // Check if bid amount is valid
        Optional<Bid> highestBid = getHighestBidForAuction(auctionId);
        log.info("Highest bid: " + (highestBid.isPresent() ? highestBid.get().getAmount() : "none"));

        // If there's a previous highest bid by this user, unfreeze it first
        highestBid.ifPresent(bid -> {
            if (bid.getBidderId().equals(bidderId)) {
                log.info("User is outbidding themselves. Unfreezing previous bid of " + bid.getAmount());
                try {
                    transactionService.unfreezeAmount(
                            bidderId,
                            bid.getAmount(),
                            "Outbidding own bid on auction " + auctionId
                    );
                } catch (Exception e) {
                    log.severe("Failed to unfreeze previous bid: " + e.getMessage());
                    throw new IllegalStateException("Failed to unfreeze previous bid: " + e.getMessage());
                }
            }
        });

        if (highestBid.isPresent()) {
            double currentHighest = highestBid.get().getAmount();
            double minimumBid = currentHighest + calculateMinimumIncrement(currentHighest);

            if (amount <= currentHighest) {
                throw new IllegalArgumentException(
                        String.format("Bid must be higher than current highest bid of LKR %,.2f", currentHighest)
                );
            }

            if (amount < minimumBid) {
                throw new IllegalArgumentException(
                        String.format("Bid must be at least LKR %,.2f (minimum increment required)", minimumBid)
                );
            }

            // If a different user previously had the highest bid, unfreeze their amount
            if (!highestBid.get().getBidderId().equals(bidderId)) {
                log.info("Outbidding user " + highestBid.get().getBidderId() + ". Unfreezing their bid of " + highestBid.get().getAmount());
                try {
                    transactionService.unfreezeAmount(
                            highestBid.get().getBidderId(),
                            highestBid.get().getAmount(),
                            "Outbid on auction " + auctionId
                    );


                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            String title = "You've been outbid";
                            String message = "Your bid of LKR " +
                                    highestBid.get().getAmount()  + " on auction " +
                                    auction.getTitle() + " was outbid by a user placing a bid of LKR" + amount + " ! " +
                                    "Reclaim the highest bid to secure the win!" ;
                            User userToNotify = userDetailsService.getUserById(highestBid.get().getBidderId());
                            excludedFromWatchlistNotify.add(userToNotify);
                            notificationEventPublisher.publishNotificationEvent(
                                    title,
                                    message,
                                    NotificationCategory.OUTBID,
                                    userToNotify,
                                    "/auctions/" + auction.getId()
                            );
                        }
                    });

                } catch (Exception e) {
                    log.severe("Failed to unfreeze previous bidder's funds: " + e.getMessage());
                    throw new IllegalStateException("Failed to unfreeze previous bidder's funds: " + e.getMessage());
                }
            }
        } else {
            // No bids yet, check against starting price
            if (amount < auction.getStartingPrice()) {
                log.warning("Bid below starting price: " + amount + " < " + auction.getStartingPrice());
                throw new IllegalArgumentException("Bid amount must be at least the starting price");
            }
        }

        // Freeze the bid amount in the user's wallet
        try {
            log.info("Freezing " + amount + " for bid");
            transactionService.freezeAmount(amount, auctionId);
        } catch (Exception e) {
            log.severe("Failed to freeze funds: " + e.getMessage());
            throw new IllegalStateException("Failed to freeze funds: " + e.getMessage());
        }

        // Create and save the bid
        Bid bid = Bid.builder()
                .auction(auction)
                .bidderId(bidderId)
                .bidderName(bidderName)
                .bidderAvatar(String.valueOf(bidderAvatar))
                .amount(amount)
                .bidTime(now)
                .build();

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                String title = "New bid placed on auction " + auction.getTitle() ;
                String message = "A bidder has placed a bid of " + bid.getAmount() + " on the auction " + auction.getTitle()  + "check it out on AuctiX" ;

                // notify seller
                notificationEventPublisher.publishNotificationEvent(
                        title,
                        message,
                        NotificationCategory.NEW_BID_RECEIVED_SELLER,
                        auction.getSeller().getUser(),
                        "/auctions/" + auction.getId()
                );

                // notify watchlist users
                excludedFromWatchlistNotify.add(bidder);

                
                watchListNotifyService.notifySubscribers(
                        auction,
                        excludedFromWatchlistNotify,
                        title,
                        message,
                        NotificationCategory.NEW_BID_RECEIVED_WATCHER,
                        "/auctions/" + auction.getId()
                );

            }
        });

        Bid savedBid = bidRepository.save(bid);

        // subscribe to watchlist if already not there
        watchListService.subscribe(bidderId, auctionId);

        BidDTO bidDTO = convertToDTO(savedBid);
        List<BidDTO> history = getBidHistoryForAuction(auctionId).stream()
                .map(this::convertToDTO)
                .toList();

        BidUpdateMessageDTO message = BidUpdateMessageDTO.builder()
                .auctionId(auctionId)
                .newBid(bidDTO)
                .bidHistory(history)
                .build();

        // Send to WebSocket topic
        messagingTemplate.convertAndSend("/topic/auction/" + auctionId, message);


        return bidDTO;

    }

    // Helper method to calculate minimum increment
    private double calculateMinimumIncrement(double currentBid) {
        // Calculate 5% increment with minimum of 100
        double increment = Math.max(100, currentBid * 0.05);
        // Round to nearest 100
        return Math.ceil(increment / 100) * 100;
    }


    @Transactional
    public void finalizeAuction(UUID auctionId) {
        Optional<Bid> winningBid = getHighestBidForAuction(auctionId);

        if (winningBid.isPresent()) {
            Bid bid = winningBid.get();

            // Complete the transaction for the winning bidder
            try {
                transactionService.completeBidTransaction(
                        bid.getBidderId(),
                        auctionId,
                        bid.getAmount()
                );
            } catch (Exception e) {
                throw new IllegalStateException("Failed to complete transaction: " + e.getMessage());
            }

            // Logic to transfer funds to seller would go here in a production app
        }
    }

    public List<MyBidAuctionDTO> getMyBidAuctions(UUID userId, String status) {
        // Get all bids by user
        List<Bid> userBids = bidRepository.findByBidderId(userId);

        // Group bids by auction
        Map<UUID, List<Bid>> bidsByAuction = userBids.stream()
                .collect(Collectors.groupingBy(bid -> bid.getAuction().getId()));

        return bidsByAuction.entrySet().stream()
                .map(entry -> {
                    UUID auctionId = entry.getKey();
                    List<Bid> auctionBids = entry.getValue();
                    Auction auction = auctionRepository.findById(auctionId).orElse(null);

                    if (auction == null) return null;

                    // Get user's highest bid for this auction
                    double highestUserBid = auctionBids.stream()
                            .mapToDouble(Bid::getAmount)
                            .max()
                            .orElse(0.0);

                    // Get current highest bid for auction
                    Optional<Bid> highestBid = getHighestBidForAuction(auctionId);
                    double currentHighestBid = highestBid
                            .map(Bid::getAmount)
                            .orElse(auction.getStartingPrice());


                    // Determine auction status
                    String auctionStatus = determineAuctionStatus(auction, userId, highestUserBid, currentHighestBid);

                    // Filter based on requested status
                    if (!status.equalsIgnoreCase("all") && !status.equalsIgnoreCase(auctionStatus)) {
                        return null;
                    }

                    return MyBidAuctionDTO.builder()
                            .auctionId(auctionId)
                            .title(auction.getTitle())
                            .currentPrice(currentHighestBid)
                            .yourHighestBid(highestUserBid)
                            .status(auctionStatus)
                            .endTime(auction.getEndTime())
                            .isLeadingBid(highestUserBid >= currentHighestBid)
                            .category(auction.getCategory())
                            .imagePaths(auction.getImagePaths())
                            .build();
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    private String determineAuctionStatus(Auction auction, UUID userId, double userHighestBid, double currentHighestBid) {
        Instant now = Instant.now();

        if (auction.getEndTime().isAfter(now)) {
            return "active";
        }

        if (userHighestBid >= currentHighestBid) {
            return "won";
        }

        return "lost";
    }


    // Add these methods to your existing BidService

    /**
     * Check if an auction has received any bids
     */
    public boolean hasAuctionReceivedBids(UUID auctionId) {
        return bidRepository.existsByAuctionId(auctionId);
    }

    /**
     * Get bid count for an auction
     */
    public int getBidCountForAuction(UUID auctionId) {
        return bidRepository.countByAuctionId(auctionId);
    }

    /**
     * Get users who have bid on an auction (for visibility when unlisted)
     */
    public List<UUID> getBiddersForAuction(UUID auctionId) {
        return bidRepository.findDistinctBidderIdsByAuctionId(auctionId);
    }
}