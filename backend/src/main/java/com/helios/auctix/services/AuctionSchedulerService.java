package com.helios.auctix.services;

import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.auction.Bid;
import com.helios.auctix.domain.notification.AuctionNotificationLog;
import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.events.notification.NotificationEventPublisher;
import com.helios.auctix.repositories.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.logging.Logger;

@Service
@Slf4j
public class AuctionSchedulerService {

    private static final Logger logger = Logger.getLogger(AuctionSchedulerService.class.getName());

    private final AuctionRepository auctionRepository;
    private final BidRepository bidRepository;
    private final BidService bidService;
    private final CoinTransactionService transactionService;
    private final DeliveryService deliveryService;
    private final NotificationEventPublisher notificationEventPublisher;
    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final WatchListNotifyService watchListNotifyService;
    private final AuctionNotificationLogRepository auctionNotificationLogRepository;

    private static final long SCHEDULE_FIXED_RATE_MS = 60_000;
    private static final long AUCTION_SOON_WINDOW_MINUTES = 10;
    private static final long AUCTION_START_DETECTION_WINDOW_MINUTES = 1;

    private static final String TIMEZONE = "Asia/Colombo";
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.of(TIMEZONE));

    // Titles and messages

    // Auction Won (for bidder)
    private static final String AUCTION_WON_TITLE_TEMPLATE = "Auction Won! You won the %s auction";
    private static final String AUCTION_WON_MESSAGE_TEMPLATE = "Congratulations! You won the auction for %s with a bid of %s";

    // Item Sold (for seller)
    private static final String ITEM_SOLD_TITLE_TEMPLATE = "Item sold! - %s auction";
    private static final String ITEM_SOLD_MESSAGE_TEMPLATE = "The item for the auction %s was sold with a bid of %s to the bidder %s";

    // Auction completed with winning bids ( for watchers)
    private static final String AUCTION_COMPLETED_WITH_WINNING_BID_TITLE_TEMPLATE = "Auction %s completed with a winning bid";
    private static final String AUCTION_COMPLETED_WITH_WINNING_BID_MESSAGE_TEMPLATE = "The auction %s you are watching completed with a winning bid of %s .";

    private static final String AUCTION_ENDED_NO_BIDS_TITLE = "Auction %s Ended Without Bids";
    private static final String AUCTION_ENDED_NO_BIDS_SELLER_MESSAGE_TEMPLATE =
            "Your auction %s has ended without any bids.";
    private static final String AUCTION_ENDED_NO_BIDS_WATCHER_MESSAGE_TEMPLATE =
            "The auction %s you're watching has ended without any bids.";

    private static final String START_SOON_TITLE_TEMPLATE = "Auction %s starts in %d minutes";
    private static final String START_SOON_MESSAGE_TEMPLATE = "The %s you're watching is starting soon at %s. Be ready to bid and win!";
    private static final String END_SOON_TITLE_TEMPLATE = "Auction %s ends in %d minutes";
    private static final String END_SOON_MESSAGE_TEMPLATE = "The %s you are watching will end in %d minutes at %s. Join the action in the decisive final minutes!";
    private static final String STARTED_TITLE_TEMPLATE = "Auction %s just started!";
    private static final String STARTED_MESSAGE_TEMPLATE = "The %s you are watching just started at %s. Join the action and bid to win before the auction ends at %s.";

    private static final String AUCTION_DETAILS_PATH_TEMPLATE = "/auction-details/%s";


    public AuctionSchedulerService(
            AuctionRepository auctionRepository,
            BidRepository bidRepository,
            BidService bidService,
            CoinTransactionService transactionService,
            DeliveryService deliveryService,
            NotificationEventPublisher notificationEventPublisher,
            UserRepository userRepository,
            WalletRepository walletRepository,
            WatchListNotifyService watchListNotifyService, AuctionNotificationLogRepository auctionNotificationLogRepository) {
        this.auctionRepository = auctionRepository;
        this.bidRepository = bidRepository;
        this.bidService = bidService;
        this.transactionService = transactionService;
        this.deliveryService = deliveryService;
        this.notificationEventPublisher = notificationEventPublisher;
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.watchListNotifyService = watchListNotifyService;
        this.auctionNotificationLogRepository = auctionNotificationLogRepository;
    }

    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.of("Asia/Colombo"));

    /**
     * Scheduled job to check for completed auctions every second
     */
    @Scheduled(fixedRate = 1000) // Run every 1 second
    @Transactional
    public void processCompletedAuctions() {
        try {
            Instant now = Instant.now();

            // Find auctions that have ended but haven't been processed yet
            List<Auction> completedAuctions = auctionRepository.findByEndTimeBeforeAndCompletedFalse(now);

            // Only log when there are auctions to process (reduce log noise)
            if (!completedAuctions.isEmpty()) {
                logger.info("Found " + completedAuctions.size() + " completed auctions to process at " + now);
            }

            for (Auction auction : completedAuctions) {
                try {
                    processAuctionCompletion(auction);
                } catch (Exception e) {
                    logger.severe("Error processing auction completion for auction ID " + auction.getId() + ": " + e.getMessage());
                    e.printStackTrace();
                }
            }
        } catch (Exception e) {
            logger.severe("Error in scheduled auction processing: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Transactional
    public void processAuctionCompletion(Auction auction) {
        UUID auctionId = auction.getId();
        logger.info("Processing completion for auction: " + auctionId);

        List<User> excludedFromWatchlistNotify = new ArrayList<>();

        try {
            // Find the highest bid
            Optional<Bid> highestBid = bidRepository.findTopByAuctionIdOrderByAmountDesc(auctionId);

            if (highestBid.isPresent()) {
                Bid winningBid = highestBid.get();
                User bidder = userRepository.findById(winningBid.getBidderId()).orElse(null);
                User seller = auction.getSeller().getUser();

                logger.info("Winning bid found: " + winningBid.getId() + " by bidder " + winningBid.getBidderId() +
                        " with amount " + winningBid.getAmount());

                // Complete the transaction - transfer from frozen funds to seller
                try {
                    // 1. Complete the bidder's transaction (unfreeze and deduct funds)
                    transactionService.completeBidTransaction(
                            winningBid.getBidderId(),
                            auctionId,
                            winningBid.getAmount()
                    );

                    // 2. Credit the seller's wallet
                    transactionService.creditSellerForAuction(
                            seller.getId(),
                            auctionId,
                            winningBid.getAmount()
                    );

                    // 3. Automatically create delivery
                    try {
                        deliveryService.createAutomaticDelivery(
                                auctionId,
                                winningBid.getBidderId(),
                                winningBid.getAmount()
                        );
                        logger.info("Successfully created automatic delivery for auction: " + auctionId);
                    } catch (Exception e) {
                        logger.warning("Failed to create automatic delivery for auction " + auctionId + ": " + e.getMessage());
                    }

                    // 4. Send notifications
                    if (bidder != null) {
                        try {
                            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                                @Override
                                public void afterCommit() {

                                    // Notify bidder (winner)
                                    String auctionTitle = auction.getTitle();
                                    String winningAmount = winningBid.getAmount().toString();
                                    String bidderUsername = bidder.getUsername();
                                    String auctionUrl = String.format(AUCTION_DETAILS_PATH_TEMPLATE, auction.getId());

                                    String wonTitle = String.format(AUCTION_WON_TITLE_TEMPLATE, auctionTitle);
                                    String wonMessage = String.format(AUCTION_WON_MESSAGE_TEMPLATE, auctionTitle, winningAmount);

                                    notificationEventPublisher.publishNotificationEvent(
                                            wonTitle,
                                            wonMessage,
                                            NotificationCategory.AUCTION_WON,
                                            bidder,
                                            auctionUrl
                                    );

                                    // Notify seller
                                    String soldTitle = String.format(ITEM_SOLD_TITLE_TEMPLATE, auctionTitle);
                                    String soldMessage = String.format(ITEM_SOLD_MESSAGE_TEMPLATE, auctionTitle, winningAmount, bidderUsername);

                                    notificationEventPublisher.publishNotificationEvent(
                                            soldTitle,
                                            soldMessage,
                                            NotificationCategory.ITEM_SOLD,
                                            seller,
                                            auctionUrl
                                    );

                                    // Prevent notifying winner again via watchlist
                                    excludedFromWatchlistNotify.add(bidder);

                                    String watcherTitle = String.format(AUCTION_COMPLETED_WITH_WINNING_BID_TITLE_TEMPLATE, auctionTitle);
                                    String watcherMessage = String.format(AUCTION_COMPLETED_WITH_WINNING_BID_MESSAGE_TEMPLATE, auctionTitle, winningAmount);

                                    watchListNotifyService.notifySubscribers(
                                            auction,
                                            excludedFromWatchlistNotify,
                                            watcherTitle,
                                            watcherMessage,
                                            NotificationCategory.AUCTION_COMPLETED,
                                            auctionUrl
                                    );
                                }
                            });

                        } catch (Exception e) {
                            logger.warning("Failed to send buyer and seller - complete with win notification, but continuing: " + e.getMessage());
                        }
                    }

                    // 5. Mark the auction as completed
                    auction.setCompleted(true);
                    auction.setWinningBidId(winningBid.getId());
                    auctionRepository.save(auction);

                    logger.info("Successfully completed auction: " + auctionId);

                } catch (Exception e) {
                    logger.severe("Error processing transaction for auction " + auctionId + ": " + e.getMessage());
                    throw e; // Re-throw to trigger transaction rollback
                }
            } else {
                // No bids were placed
                logger.info("No bids found for auction: " + auctionId + ". Marking as completed without a winner.");

                // Notify the seller that auction ended without bids
                try {
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {

                            String auctionTitle = auction.getTitle();
                            String auctionUrl = String.format(AUCTION_DETAILS_PATH_TEMPLATE, auction.getId());
                            String messageSeller = String.format(AUCTION_ENDED_NO_BIDS_SELLER_MESSAGE_TEMPLATE, auctionTitle);

                            notificationEventPublisher.publishNotificationEvent(
                                    AUCTION_ENDED_NO_BIDS_TITLE,
                                    messageSeller,
                                    NotificationCategory.AUCTION_COMPLETED,
                                    auction.getSeller().getUser(),
                                    auctionUrl
                            );

                            // Notify the watchers
                            String messageWatcher = String.format(AUCTION_ENDED_NO_BIDS_WATCHER_MESSAGE_TEMPLATE, auctionTitle);
                            watchListNotifyService.notifySubscribers(
                                    auction,
                                    null,
                                    AUCTION_ENDED_NO_BIDS_TITLE,
                                    messageWatcher,
                                    NotificationCategory.AUCTION_COMPLETED,
                                    auctionUrl
                            );
                        }
                    });

                } catch (Exception e) {
                    logger.warning("Failed to send notification, but continuing: " + e.getMessage());
                }

                // Mark auction as completed
                auction.setCompleted(true);
                auctionRepository.save(auction);
            }
        } catch (Exception e) {
            logger.severe("Error completing auction " + auctionId + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }


    @Scheduled(fixedRate = SCHEDULE_FIXED_RATE_MS)
    public void sendAuctionEndSoonNotifications() {
        Instant now = Instant.now();
        Instant inXMinutes = now.plus(AUCTION_SOON_WINDOW_MINUTES, ChronoUnit.MINUTES);

        List<Auction> endingSoonAuctions = auctionRepository.findByEndTimeBetween(now, inXMinutes);

        for (Auction auction : endingSoonAuctions) {
            UUID auctionId = auction.getId();

            boolean shouldSend = auctionNotificationLogRepository
                    .findTopByAuctionIdAndCategoryOrderBySentAtDesc(auctionId, NotificationCategory.AUCTION_END_SOON)
                    .map(log -> log.getSentAt().isBefore(auction.getUpdatedAt()))
                    .orElse(true);

            if (shouldSend) {
                String formattedEndTime = FORMATTER.format(auction.getEndTime());
                String title = String.format(END_SOON_TITLE_TEMPLATE, auction.getTitle(), AUCTION_SOON_WINDOW_MINUTES);
                String message = String.format(
                        END_SOON_MESSAGE_TEMPLATE,
                        auction.getTitle(),
                        AUCTION_SOON_WINDOW_MINUTES,
                        formattedEndTime
                );
                String url = String.format(AUCTION_DETAILS_PATH_TEMPLATE, auction.getId());

                watchListNotifyService.notifySubscribers(
                        auction,
                        null,
                        title,
                        message,
                        NotificationCategory.AUCTION_END_SOON,
                        url
                );

                auctionNotificationLogRepository.save(
                        new AuctionNotificationLog(auctionId, NotificationCategory.AUCTION_END_SOON, Instant.now())
                );
            }
        }
    }

    @Scheduled(fixedRate = SCHEDULE_FIXED_RATE_MS)
    public void sendAuctionStartSoonNotifications() {
        Instant now = Instant.now();
        Instant inXMinutes = now.plus(AUCTION_SOON_WINDOW_MINUTES, ChronoUnit.MINUTES);

        List<Auction> startingSoonAuctions = auctionRepository.findByStartTimeBetween(now, inXMinutes);

        for (Auction auction : startingSoonAuctions) {
            UUID auctionId = auction.getId();

            boolean shouldSend = auctionNotificationLogRepository
                    .findTopByAuctionIdAndCategoryOrderBySentAtDesc(auctionId, NotificationCategory.AUCTION_START_SOON)
                    .map(log -> log.getSentAt().isBefore(auction.getUpdatedAt()))
                    .orElse(true);

            if (shouldSend) {
                String formattedStartTime = FORMATTER.format(auction.getStartTime());
                String title = String.format(START_SOON_TITLE_TEMPLATE, auction.getTitle(), AUCTION_SOON_WINDOW_MINUTES);
                String message = String.format(
                        START_SOON_MESSAGE_TEMPLATE,
                        auction.getTitle(),
                        formattedStartTime
                );
                String url = String.format(AUCTION_DETAILS_PATH_TEMPLATE, auction.getId());

                watchListNotifyService.notifySubscribers(
                        auction,
                        null,
                        title,
                        message,
                        NotificationCategory.AUCTION_START_SOON,
                        url
                );

                auctionNotificationLogRepository.save(
                        new AuctionNotificationLog(auctionId, NotificationCategory.AUCTION_START_SOON, Instant.now())
                );
            }
        }
    }



    @Scheduled(fixedRate = SCHEDULE_FIXED_RATE_MS)
    public void sendAuctionStartedNotifications() {
        Instant now = Instant.now();
        Instant oneMinuteAgo = now.minus(AUCTION_START_DETECTION_WINDOW_MINUTES, ChronoUnit.MINUTES);

        List<Auction> justStartedAuctions = auctionRepository.findByStartTimeBetween(oneMinuteAgo, now);

        for (Auction auction : justStartedAuctions) {
            UUID auctionId = auction.getId();

            boolean shouldSend = auctionNotificationLogRepository
                    .findTopByAuctionIdAndCategoryOrderBySentAtDesc(auctionId, NotificationCategory.AUCTION_STARTED)
                    .map(log -> log.getSentAt().isBefore(auction.getUpdatedAt()))
                    .orElse(true);

            if (shouldSend) {
                String formattedStartTime = FORMATTER.format(auction.getStartTime());
                String formattedEndTime = FORMATTER.format(auction.getEndTime());

                String title = String.format(STARTED_TITLE_TEMPLATE, auction.getTitle());
                String message = String.format(STARTED_MESSAGE_TEMPLATE, auction.getTitle(), formattedStartTime, formattedEndTime);
                String url = String.format(AUCTION_DETAILS_PATH_TEMPLATE, auction.getId());

                watchListNotifyService.notifySubscribers(
                        auction,
                        null,
                        title,
                        message,
                        NotificationCategory.AUCTION_STARTED,
                        url
                );

                auctionNotificationLogRepository.save(
                        new AuctionNotificationLog(auctionId, NotificationCategory.AUCTION_STARTED, Instant.now())
                );
            }
        }
    }


    /**
     * Manual trigger to process a specific auction completion (can be used for testing or admin functions)
     */
    @Transactional
    public void manuallyCompleteAuction(UUID auctionId) {
        try {
            Auction auction = auctionRepository.findById(auctionId)
                    .orElseThrow(() -> new IllegalArgumentException("Auction not found: " + auctionId));

            processAuctionCompletion(auction);
        } catch (Exception e) {
            logger.severe("Error manually completing auction: " + e.getMessage());
            throw e;
        }
    }
}