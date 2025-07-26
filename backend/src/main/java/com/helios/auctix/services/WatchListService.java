package com.helios.auctix.services;

import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.auction.Bid;
import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.watchlist.AuctionWatchList;
import com.helios.auctix.dtos.AuctionDetailsDTO;
import com.helios.auctix.dtos.BidDTO;
import com.helios.auctix.dtos.UserDTO;
import com.helios.auctix.dtos.WatchListAuctionDTO;
import com.helios.auctix.events.notification.BulkNotificationPublisher;
import com.helios.auctix.repositories.AuctionRepository;
import com.helios.auctix.repositories.AuctionWatchListRepository;
import com.helios.auctix.repositories.BidRepository;
import com.helios.auctix.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.data.domain.*;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.Nullable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class WatchListService {

    private final AuctionWatchListRepository watchRepo;
    private final AuctionRepository auctionRepo;
    private final UserRepository userRepo;
    private final AuctionService auctionService;
    private final BidRepository bidRepository;

    public WatchListService(
            AuctionWatchListRepository watchRepo,
            AuctionRepository auctionRepo,
            UserRepository userRepo,
            @Lazy AuctionService auctionService, // prevent the cycle
            BidRepository bidRepository
    ) {
        this.watchRepo = watchRepo;
        this.auctionRepo = auctionRepo;
        this.userRepo = userRepo;
        this.auctionService = auctionService;
        this.bidRepository = bidRepository;
    }

    public boolean isWatchedByUser(User user, UUID auctionId) {
        Optional<Auction> auctionOpt = auctionRepo.findById(auctionId);
        if (auctionOpt.isEmpty()) {
            return false;
        }
        return watchRepo.existsByUserAndAuction(user, auctionOpt.get());
    }

    @Transactional
    public void subscribe(UUID userId, UUID auctionId) {
        User user = userRepo.findById(userId).orElseThrow();
        Auction auction = auctionRepo.findById(auctionId).orElseThrow();

        if (!watchRepo.existsByUserAndAuction(user, auction)) {
            AuctionWatchList watch = AuctionWatchList.builder()
                    .user(user)
                    .auction(auction)
                    .build();
            watchRepo.save(watch);
        }
    }

    @Transactional
    public void unsubscribe(UUID userId, UUID auctionId) {
        User user = userRepo.findById(userId).orElseThrow();
        Auction auction = auctionRepo.findById(auctionId).orElseThrow();

        watchRepo.findByUserAndAuction(user, auction).ifPresent(watchRepo::delete);
    }

    @Transactional(readOnly = true)
    public Page<WatchListAuctionDTO> getWatchList(UUID userId, String search, Pageable pageable) {
        String tsQuery = buildTsQuery(search);

        int limit = pageable.getPageSize();
        int offset = (int) pageable.getOffset();

        List<AuctionWatchList> watched = watchRepo.findWatchedAuctionsWithFullTextSearch(userId, tsQuery, limit, offset);
        long total = watchRepo.countWatchedAuctionsWithFullTextSearch(userId, tsQuery);

        List<WatchListAuctionDTO> dtoList = watched.stream().map(wl -> {
            Auction auction = wl.getAuction();

            AuctionDetailsDTO auctionDetailsDTO = auctionService.convertToDTO(auction);

            BidDTO currentHighestBid = auctionDetailsDTO.getCurrentHighestBid();
            UUID currentHighestBidderId = currentHighestBid != null ? currentHighestBid.getBidderId() : null;
            double currentHighestBidAmount = currentHighestBid != null ? currentHighestBid.getAmount() : 0.0;

            Optional<Bid> userBidOpt = bidRepository.findTopByAuctionIdAndBidderIdOrderByAmountDesc(
                    auction.getId(), userId
            );

            Bid userBid = userBidOpt.orElse(null);
            Double userBidAmount = userBid != null ? userBid.getAmount() : null;

            boolean isOutbid = userBidAmount != null && userBidAmount < currentHighestBidAmount;

            boolean isHighestBidder = userBid != null &&
                    currentHighestBidderId != null &&
                    currentHighestBidderId.equals(userId);

            return WatchListAuctionDTO.builder()
                    .auction(auctionDetailsDTO)
                    .isOutbid(isOutbid)
                    .isHighestBidder(isHighestBidder)
                    .userBidAmount(userBidAmount)
                    .build();
        }).toList();

        return new PageImpl<>(dtoList, pageable, total);
    }

    private String buildTsQuery(String searchTerm) {
        if (searchTerm == null || searchTerm.isBlank()) {
            return null;
        }

        String sanitized = searchTerm.replaceAll("[^\\w\\s]", "");
        return Arrays.stream(sanitized.trim().split("\\s+"))
                .map(word -> word + ":*")
                .collect(Collectors.joining(" & "));
    }

}
