package com.helios.auctix.config;

import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.repositories.AuctionRepository;
import com.helios.auctix.repositories.UserRepository;
import com.helios.auctix.services.ChatService;
import com.helios.auctix.services.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Log
@RequiredArgsConstructor
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final ChatService chatService;
    private final AuctionRepository auctionRepository;

    private static final Pattern AUCTION_ID_PATTERN = Pattern.compile("/topic/auction/([^/]+)/chat");
    private static final String ANONYMOUS_KEY = "GUEST_USER";

    // Store session ID to authentication mapping
    private final Map<String, Authentication> sessionAuthMap = new HashMap<>();


    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        // === Allow SockJS handshake/info requests to pass through ===
        if (accessor.getCommand() == null) {
            return message;
        }
        // === End block ===

        String sessionId = accessor.getSessionId();
        log.info("Processing message type: " + accessor.getCommand() + " for session: " + sessionId);
/*
@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        // Allow SockJS handshake (paths like /ws-auction/info)
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String endpoint = accessor.getNativeHeader("stompEndpoint").get(0);
            if (endpoint.contains("/info")) {
                return message; // Skip authentication for SockJS handshake
            }
        }

        // Your existing JWT validation logic for other messages
        // ...
    }
}

 */
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            try {

                String authHeader = accessor.getFirstNativeHeader("Authorization");
                String auctionId = accessor.getFirstNativeHeader("auctionId");
                Matcher matcher = AUCTION_ID_PATTERN.matcher(auctionId != null ? auctionId : "");

                if (matcher.find()) {
                    auctionId = matcher.group(1);
                }

                    Authentication auth = null;
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7).trim();

                    if (token != null && !token.isEmpty()) {

                        auth = authenticateUser(token, auctionId);
                    }
                }

                if (auth == null) {
                    // anonymous authentication for guest/non-logged in readonly users
                    auth = createAnonymousAuthentication();
                }

                // Store the authentication with the session ID
                sessionAuthMap.put(sessionId, auth);
                accessor.setUser(auth);

            } catch (Exception e) {
                log.warning("Exception during WebSocket authentication: " + e.getMessage());
                Authentication auth = createAnonymousAuthentication();
                sessionAuthMap.put(sessionId, auth);
                accessor.setUser(auth);
            }
        }

        else if (sessionId != null) {
            Authentication auth = sessionAuthMap.get(sessionId);
            if (auth != null) {
                accessor.setUser(auth);
                log.info("Set authentication for session: " + sessionId + " user: " + auth.getName());
            }

            if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                handleSubscribe(accessor, auth);
            }

            else if (StompCommand.SEND.equals(accessor.getCommand())) {
                if (auth == null || auth instanceof AnonymousAuthenticationToken) {
                    log.warning("Unauthenticated user attempting to send message - rejected");
                    return null; // Reject the message
                }
            }

            else if (StompCommand.DISCONNECT.equals(accessor.getCommand())) {
                sessionAuthMap.remove(sessionId);
                log.info("Removed chat session with id: " + sessionId);
            }
        }

        return message;
    }

    private Authentication authenticateUser(String token, String auctionId) {
        try {
            String userEmail = jwtService.extractEmail(token);

            if (userEmail != null && jwtService.isValidToken(token)) {
                User user = userRepository.findByEmail(userEmail);
                if (user == null) {
                    log.warning("User not found for email: " + userEmail);
                    return null;
                }
                if (!user.getRoleEnum().equals(UserRoleEnum.BIDDER)) {
                    if (user.getRoleEnum().equals(UserRoleEnum.SELLER)) {
                        if (auctionId == null || auctionId.isBlank()) {
                            log.warning("Auction ID is required for seller authentication.");
                            return null;
                        }

                        UUID sellerID = user.getSeller().getId();
                        boolean isSellerOwnedAuction = auctionRepository.isSellerOwnerOfAuction(
                                UUID.fromString(auctionId),
                                sellerID
                        );

                        log.info("Seller ownership check for auction " + auctionId + ": " + isSellerOwnedAuction);

                        if (!isSellerOwnedAuction) {
                            return null;
                        }
                    } else {
                        return null;
                    }
                }

                List<GrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + user.getRoleEnum().name())
                );

                Authentication authentication = new UsernamePasswordAuthenticationToken(
                        userEmail,
                        null,
                        authorities
                );

                log.info("WebSocket authentication successful for user: " + userEmail);
                return authentication;
            }
        } catch (Exception e) {
            log.warning("Authentication failed: " + e.getMessage());
        }

        return null;
    }


    private Authentication createAnonymousAuthentication() {
        String guestId = "guest-" + UUID.randomUUID().toString().substring(0, 8);
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_GUEST"));  // so it's actually not a role in the db, doesnt have to be?

        Authentication authentication = new AnonymousAuthenticationToken(
                ANONYMOUS_KEY, guestId, authorities);
        log.info("Created guest WebSocket session: " + guestId);
        return authentication;
    }

    private void handleSubscribe(StompHeaderAccessor accessor, Authentication auth) {
        if (auth != null && !(auth instanceof AnonymousAuthenticationToken)) {
            String destination = accessor.getDestination();
            Matcher matcher = AUCTION_ID_PATTERN.matcher(destination != null ? destination : "");

            if (matcher.find()) {
                String auctionId = matcher.group(1);
                String userEmail = auth.getName();

                try {
                    User user = userRepository.findByEmail(userEmail);
                    if (user != null && auctionId != null) {
                        if (user.getRoleEnum().equals(UserRoleEnum.SELLER)) {
                            // check if this chat is
                            boolean isSellerOwnedAuction = auctionRepository.isSellerOwnerOfAuction(UUID.fromString(auctionId), user.getSeller().getId());
                            if (!isSellerOwnedAuction) {
                                return;
                            }
                        }

                        log.info("Auto joining user " + userEmail + " to chat room for auction: " + auctionId);
                        chatService.joinChatRoom(user, UUID.fromString(auctionId));
                    }
                } catch (Exception e) {
                    log.warning("Error joining chat room: " + e.getMessage());
                }
            }
        } else {
            log.info("Guest user subscribing to chat (read only)");
        }
    }
}