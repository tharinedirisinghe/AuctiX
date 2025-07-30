package com.helios.auctix.controllers;

import com.helios.auctix.domain.auction.Bid;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.dtos.BidDTO;
import com.helios.auctix.dtos.MyBidAuctionDTO;
import com.helios.auctix.dtos.PlaceBidRequest;
import com.helios.auctix.services.AuctionService;
import com.helios.auctix.services.BidService;
import com.helios.auctix.services.user.UserDetailsService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/bids")
@CrossOrigin(origins = "*")
@AllArgsConstructor
public class BidController {

    private final BidService bidService;
    private final AuctionService auctionService;
    private final Logger log = Logger.getLogger(BidController.class.getName());
    private final UserDetailsService userDetailsService;

    //to get bid history
    @GetMapping("/auction/{auctionId}")
    public ResponseEntity<List<BidDTO>> getBidHistoryForAuction(@PathVariable UUID auctionId) {
        try {
            List<BidDTO> bidHistory = bidService.getBidHistoryForAuction(auctionId)
                    .stream()
                    .map(bidService::convertToDTO)
                    .toList();
            return ResponseEntity.ok(bidHistory);
        } catch (Exception e) {
            log.warning("Error fetching bid history for auction " + auctionId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    //to get the highest bid
    @GetMapping("/auction/{auctionId}/highest")
    public ResponseEntity<?> getHighestBidForAuction(@PathVariable UUID auctionId) {
        try {
            Optional<Bid> highestBid = bidService.getHighestBidForAuction(auctionId);
            return highestBid.map(bid -> ResponseEntity.ok(convertToDTO(bid)))
                    .orElseGet(() -> ResponseEntity.ok(null)); // Return null if no bids yet
        } catch (Exception e) {
            log.warning("Error fetching highest bid for auction " + auctionId + ": " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }


    @GetMapping("/my-auctions")
    public ResponseEntity<List<MyBidAuctionDTO>> getMyBidAuctions(
            @RequestParam(value = "status", defaultValue = "all") String status) {
        try {
            // Get authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = userDetailsService.getAuthenticatedUser(authentication);

            // Get auctions based on status
            List<MyBidAuctionDTO> myAuctions = bidService.getMyBidAuctions(user.getId(), status);

            return ResponseEntity.ok(myAuctions);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            log.warning("Error fetching user's bid auctions: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/my-stats")
    public ResponseEntity<Map<String, Integer>> getMyBidStats() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User user = userDetailsService.getAuthenticatedUser(authentication);

            int totalBids = bidService.countTotalBids(user.getId());
            int wonAuctions = bidService.countWonAuctions(user.getId());
            int leadingBidAuctions = bidService.countLeadingBidAuctions(user.getId());
            int activeNonLeadingBids = bidService.countActiveOutbidAuctions(user.getId());
            int activeBids = bidService.countActiveBids(user.getId());

            Map<String, Integer> stats = new HashMap<>();
            stats.put("totalBids", totalBids);
            stats.put("wonAuctions", wonAuctions);
            stats.put("leadingBidAuctions", leadingBidAuctions);
            stats.put("activeOutbidAuctions", activeNonLeadingBids);
            stats.put("activeBids", activeBids);

            return ResponseEntity.ok(stats);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        } catch (Exception e) {
            log.warning("Error fetching bid stats: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


    //to place new bids
    @PostMapping("/place")
    public ResponseEntity<?> placeBid(@RequestBody PlaceBidRequest request) {
        try {
            Authentication authentication = SecurityContextHolder
                    .getContext()
                    .getAuthentication();

            // Check if user is authenticated
            if (authentication == null || !authentication.isAuthenticated() ||
                    authentication.getPrincipal().equals("anonymousUser")) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "AUTHENTICATION_REQUIRED");
                errorResponse.put("message", "Please log in to place a bid");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);

            }

            User bidder = userDetailsService
                    .getAuthenticatedUser(authentication);

            // Additional null check for bidder
            if (bidder == null) {
                Map<String, String> errorResponse = new HashMap<>();
                errorResponse.put("error", "USER_NOT_FOUND");
                errorResponse.put("message", "User session invalid. Please log in again");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
            }

            BidDTO placedBid = bidService.placeBid(request, bidder);
            return ResponseEntity.ok(placedBid);

        } catch (IllegalArgumentException e) {
            log.warning("Bad request in place bid: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "INVALID_BID");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (IllegalStateException e) {
            log.warning("Conflict in place bid: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "BID_CONFLICT");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(errorResponse);
        } catch (SecurityException e) {
            log.warning("Security violation in place bid: " + e.getMessage());
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "ACCESS_DENIED");
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorResponse);
        } catch (Exception e) {
            log.severe("Error placing bid: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "INTERNAL_ERROR");
            errorResponse.put("message", "An unexpected error occurred. Please try again later.");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    private BidDTO convertToDTO(Bid bid) {
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
                .build();
    }
    // Request DTO for placing bids
    // Use com.helios.auctix.dtos.PlaceBidRequest instead of inner class.
}