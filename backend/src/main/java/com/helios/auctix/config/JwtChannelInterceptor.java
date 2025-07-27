package com.helios.auctix.config;

import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.chat.ChatRoomType;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.repositories.AuctionRepository;
import com.helios.auctix.repositories.UserRepository;
import com.helios.auctix.repositories.chat.ChatRoomRepository;
import com.helios.auctix.services.ChatService;
import com.helios.auctix.services.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.java.Log;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
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

import java.time.Duration;
import java.time.Instant;
import java.util.*;
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
    private final ChatRoomRepository chatRoomRepository;

    private static final Pattern AUCTION_CHAT_PATTERN = Pattern.compile("/topic/chat/auction/([^/]+)");
    private static final Pattern PRIVATE_CHAT_PATTERN = Pattern.compile("/topic/chat/private/([^/]+)");
    private static final Pattern GROUP_CHAT_PATTERN = Pattern.compile("/topic/chat/group/([^/]+)");
    private static final Pattern SUPPORT_CHAT_PATTERN = Pattern.compile("/topic/chat/support/([^/]+)");

    private static final Pattern AUCTION_PRICE_UPDATE_PATTERN = Pattern.compile("^/topic/auction/([a-fA-F0-9\\-]+)$");

    private static final String ANONYMOUS_KEY = "GUEST_USER";
    private static final int AUCTION_CHAT_CUTOFF_AFTER_HOURS = 3;

    // Store session ID to authentication mapping
    private final Map<String, Authentication> sessionAuthMap = new HashMap<>();

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        String sessionId = accessor.getSessionId();
        StompCommand command = accessor.getCommand();
        log.info("Processing message type: " + command + " for session: " + sessionId);

        if (StompCommand.CONNECT.equals(command)) {
            try {
                String authHeader = accessor.getFirstNativeHeader("Authorization");
                String chatTypeHeader = accessor.getFirstNativeHeader("chatType");
                String chatIdHeader = accessor.getFirstNativeHeader("chatId");
                log.info("CONNECT headers - Authorization: " + authHeader + ", chatType: " + chatTypeHeader + ", chatId: " + chatIdHeader);

                // For non-chat endpoints (like auction price updates), chatTypeHeader may be missing
                // If missing, assume no auth required and create anonymous user
                if (chatTypeHeader == null || chatTypeHeader.isBlank()) {
                    log.info("No chatType header - assuming non-chat WS endpoint, allow anonymous connection");
                    Authentication anonAuth = createAnonymousAuthentication();
                    sessionAuthMap.put(sessionId, anonAuth);
                    accessor.setUser(anonAuth);
                    return message;
                }

                ChatRoomType chatRoomType;
                try {
                    chatRoomType = ChatRoomType.valueOf(chatTypeHeader.toUpperCase());
                } catch (IllegalArgumentException e) {
                    log.warning("Invalid chatType header value: " + chatTypeHeader + ", rejecting connection");
                    return null; // Reject connection
                }

                if (chatIdHeader == null || chatIdHeader.isBlank()) {
                    log.warning("Missing chatId header in CONNECT");
                    return null; // reject connection
                }
                String chatId = chatIdHeader.trim();

                Authentication auth = null;
                if (authHeader != null && authHeader.startsWith("Bearer ")) {
                    String token = authHeader.substring(7).trim();
                    if (!token.isEmpty()) {
                        auth = authenticateUser(token, chatId, chatRoomType);
                    }
                }

                // For auction chat, allow anonymous on connect (for read only SUBSCRIBE)
                // For other chat types, require authentication on connect
                if (auth == null) {
                    if (chatRoomType == ChatRoomType.AUCTION) {
                        auth = createAnonymousAuthentication();
                    } else {
                        log.warning("Authentication required for chat type: " + chatRoomType);
                        return null; // reject connection
                    }
                }

                sessionAuthMap.put(sessionId, auth);
                accessor.setUser(auth);

            } catch (Exception e) {
                log.warning("Exception during WebSocket authentication: " + e.getMessage());
                return null; // Reject connection on error
            }
            return message;
        }

        // For other STOMP commands (SUBSCRIBE, SEND, DISCONNECT)
        if (sessionId != null) {
            Authentication auth = sessionAuthMap.get(sessionId);
            if (auth != null) {
                accessor.setUser(auth);
                log.info("Set authentication for session: " + sessionId + " user: " + auth.getName());
            }

            String destination = accessor.getDestination();

            if (StompCommand.SUBSCRIBE.equals(command)) {
                if (destination != null && AUCTION_PRICE_UPDATE_PATTERN.matcher(destination).matches()) {
                    // Allow anonymous subscription (price updates)
                    return message;
                }

                if (destination != null && AUCTION_CHAT_PATTERN.matcher(destination).matches()) {
                    if (auth instanceof AnonymousAuthenticationToken) {
                        return message; // read only access to auction chats for non-logged in users
                    }
                }

                // Other chats
                if (auth == null || auth instanceof AnonymousAuthenticationToken) {
                    log.warning("Anonymous user trying to subscribe to non-auction chat - reject");
                    return null;
                }

                // handleSubscribe for chat membership validation, etc.
                handleSubscribe(accessor, auth);
            }
            else if (StompCommand.SEND.equals(command)) {
                // For all chats (including auction), require authenticated user to send messages
                if (auth == null || auth instanceof AnonymousAuthenticationToken) {
                    log.warning("Unauthenticated user attempting to send message - rejected");
                    return null;
                }
            }
            else if (StompCommand.DISCONNECT.equals(command)) {
                sessionAuthMap.remove(sessionId);
                log.info("Removed chat session with id: " + sessionId);
            }
        }

        return message;
    }

    private Authentication authenticateUser(String token, String id, ChatRoomType chatRoomType) {
        log.info("authenticateUser called with token present: " + (token != null) + ", id: " + id + ", chatRoomType: " + chatRoomType);
        try {
            String userEmail = jwtService.extractEmail(token);

            if (userEmail != null && jwtService.isValidToken(token)) {
                User user = userRepository.findByEmail(userEmail);
                if (user == null) {
                    log.warning("User not found for email: " + userEmail);
                    return null;
                }

                switch (chatRoomType) {
                    case AUCTION:
                        if (id != null && !id.isBlank()) {
                            Optional<Auction> auction = auctionRepository.findById(UUID.fromString(id));
                            if (auction.isEmpty()) {
                                log.warning("Auction not found: " + id);
                                return null;
                            }

                            Instant cutoffTime = Instant.now().minus(Duration.ofHours(AUCTION_CHAT_CUTOFF_AFTER_HOURS));
                            if (auction.get().getEndTime().isBefore(cutoffTime)) {
                                log.warning("Auction chat cutoff time exceeded for auction: " + id);
                                return null;
                            }

                            // Bidder can join any auction they've bid on
                            if (user.getRoleEnum().equals(UserRoleEnum.BIDDER)) {
                                // Optional: You can verify they actually placed a bid on this auction
                            } else if (user.getRoleEnum().equals(UserRoleEnum.SELLER)) {
                                UUID sellerId = user.getSeller().getId();
                                if (!auctionRepository.isSellerOwnerOfAuction(UUID.fromString(id), sellerId)) {
                                    log.warning("Seller does not own this auction: " + id);
                                    return null;
                                }
                            } else {
                                log.warning("User not authorized for auction chat: " + user.getRoleEnum());
                                return null;
                            }
                        }
                        break;

                    case PRIVATE, GROUP:
                        if (!chatRoomRepository.isUserMemberOfChatRoom(UUID.fromString(id), user.getId())) {
                            log.warning("User not authorized to access private chat: " + id);
                            return null;
                        }
                        break;

                    case SUPPORT:
                        if (!chatRoomRepository.isUserMemberOfChatRoom(UUID.fromString(id), user.getId())) {
                            if (!(user.getRoleEnum().equals(UserRoleEnum.ADMIN) || user.getRoleEnum().equals(UserRoleEnum.SUPER_ADMIN))) {
                                log.warning("Only admins can access support chat");
                                return null;
                            }
                        }
                        break;

                    default:
                        log.warning("Unknown chat room type: " + chatRoomType);
                        return null;
                }

                List<GrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_" + user.getRoleEnum().name())
                );

                return new UsernamePasswordAuthenticationToken(userEmail, null, authorities);
            }
        } catch (Exception e) {
            log.warning("Authentication failed: " + e.getMessage());
        }

        return null;
    }

    private Authentication createAnonymousAuthentication() {
        String guestId = "guest-" + UUID.randomUUID().toString().substring(0, 8);
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_GUEST"));

        Authentication authentication = new AnonymousAuthenticationToken(
                ANONYMOUS_KEY, guestId, authorities);
        log.info("Created guest WebSocket session: " + guestId);
        return authentication;
    }

    private void handleSubscribe(StompHeaderAccessor accessor, Authentication auth) {
        String destination = accessor.getDestination();
        String userEmail = auth.getName();

        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            log.warning("User not found during subscribe: " + userEmail);
            return;
        }

        if (destination == null) {
            log.warning("Null destination during subscribe");
            return;
        }

        try {
            Matcher auctionMatcher = AUCTION_CHAT_PATTERN.matcher(destination);
            Matcher privateChatMatcher = PRIVATE_CHAT_PATTERN.matcher(destination);
            Matcher groupChatMatcher = GROUP_CHAT_PATTERN.matcher(destination);
            Matcher supportChatMatcher = SUPPORT_CHAT_PATTERN.matcher(destination);

            if (auctionMatcher.find()) {
                String auctionId = auctionMatcher.group(1);

                if (user.getRoleEnum().equals(UserRoleEnum.SELLER)) {
                    boolean isSellerOwnedAuction = auctionRepository.isSellerOwnerOfAuction(UUID.fromString(auctionId), user.getSeller().getId());
                    if (!isSellerOwnedAuction) {
                        log.warning("Seller user " + userEmail + " not owner of auction " + auctionId);
                        return;
                    }
                }

                log.info("Joining auction chat room for user " + userEmail + " auction: " + auctionId);
                chatService.joinChatRoom(user, UUID.fromString(auctionId));
            }
            else if (privateChatMatcher.find()) {
                String chatId = privateChatMatcher.group(1);
                if (!isUserMemberOfChatRoom(user, chatId)) {
                    log.warning("User " + userEmail + " not authorized for private chat: " + chatId);
                    return;
                }
//                log.info("Joining private chat room " + chatId + " for user " + userEmail);
//                chatService.joinChatRoom(user, UUID.fromString(chatId), ChatRoomType.PRIVATE);
            }
            else if (groupChatMatcher.find()) {
                String groupId = groupChatMatcher.group(1);
                if (!isUserMemberOfChatRoom(user, groupId)) {
                    log.warning("User " + userEmail + " not authorized for group chat: " + groupId);
                    return;
                }
//                log.info("Joining group chat room " + groupId + " for user " + userEmail);
//                chatService.joinChatRoom(user, UUID.fromString(groupId), ChatRoomType.GROUP);
            }
            else if (supportChatMatcher.find()) {
                String chatRoomId = supportChatMatcher.group(1);
                if (!isUserMemberOfChatRoom(user, chatRoomId)) {
                    log.warning("User " + userEmail + " not authorized for chat room: " + chatRoomId);
                    return;
                }
                List<UserRoleEnum> adminRoles = List.of(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN);
                if (adminRoles.contains(user.getRoleEnum())) {
                    chatService.joinChatRoom(user, UUID.fromString(chatRoomId), ChatRoomType.SUPPORT);
                }
            }
            else {
                log.info("Unknown chat subscription destination: " + destination);
            }
        } catch (Exception e) {
            log.warning("Error joining chat room: " + e.getMessage());
        }
    }


    private boolean isUserMemberOfChatRoom(User user, String chatRoomId) {
        try {
            UUID uuid = UUID.fromString(chatRoomId);
            return chatRoomRepository.isUserMemberOfChatRoom(uuid, user.getId());
        } catch (IllegalArgumentException e) {
            log.warning("Invalid chatRoomId UUID format: " + chatRoomId);
            return false;
        }
    }
}
