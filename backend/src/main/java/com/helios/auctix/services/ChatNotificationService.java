package com.helios.auctix.services;

import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.chat.ChatRoomType;
import com.helios.auctix.domain.chat.ChatRoomUserUnreadStatus;
import com.helios.auctix.domain.chat.ChatRoom;
import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.events.notification.BulkNotificationPublisher;
import com.helios.auctix.events.notification.NotificationEventPublisher;
import com.helios.auctix.repositories.AuctionWatchListRepository;
import com.helios.auctix.repositories.UserRepository;
import com.helios.auctix.repositories.chat.ChatMessageRepository;
import com.helios.auctix.repositories.chat.ChatRoomRepository;
import com.helios.auctix.repositories.chat.ChatRoomUserUnreadStatusRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatNotificationService {

    private final ChatRoomUserUnreadStatusRepository statusRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final AuctionWatchListRepository watchlistRepository;
    private final WatchListNotifyService watchListNotifyService;
    private final NotificationEventPublisher singleNotificationPublisher;
    private final BulkNotificationPublisher bulkNotificationPublisher;

    //========== MESSAGE TEMPLATES===========
    // === AUCTION WATCHLIST CHAT ===
    private static final String AUCTION_CHAT_TITLE = "New Message in \"%s\" auction";
    private static final String AUCTION_CHAT_MESSAGE = "You have %d unread message%s in the auction chat: \"%s\".";
    private static final String AUCTION_PARTIAL_URL_TEMPLATE = "/auction-details/%s";

    // === BID WINNER CHAT ===
    private static final String BID_WINNER_CHAT_TITLE = "New Message from Auction Winner in \"%s\"";
    private static final String BID_WINNER_CHAT_MESSAGE = "You have unread messages from the winning bidder in \"%s\".";

    // === SELLER CHAT ===
    private static final String SELLER_CHAT_TITLE = "New Message from Seller in \"%s\"";
    private static final String SELLER_CHAT_MESSAGE = "You have unread messages from the seller in \"%s\".";

    // === PRIVATE CHAT (1:1) ===
    private static final String PRIVATE_CHAT_TITLE = "New Message from %s in \"%s\"";
    private static final String PRIVATE_CHAT_MESSAGE = "You have unread messages in your private chat with %s about \"%s\".";


//    @Value("${chat.notify.scheduler.check.rate:60000}")
//    private String chatNotifyCheckRate;

    @Value("${chat.notify.cutoff.seconds:60}")
    private long chatNotifyCutoff;

    @Scheduled(fixedRateString = "${chat.notify.scheduler.check.rate:60000}")
    public void scheduleUnreadNotification() {
        log.info("Checking for unread messages to notify ...");
        LocalDateTime cutoff = LocalDateTime.now().minusSeconds(chatNotifyCutoff);
        sendUnreadNotifications(cutoff);
    }

    /**
     * When a new message is sent in chatRoom by sender.
     * Increments unreadCount for all participants except sender.
     */
    @Transactional
    public void markUnreadForOthers(ChatRoom chatRoom, User sender) {
        List<ChatRoomUserUnreadStatus> statuses = statusRepository.findByChatRoomId(chatRoom.getId());

        for (ChatRoomUserUnreadStatus status : statuses) {
            if (!status.getUserId().equals(sender.getId())) {
                status.setUnreadCount(status.getUnreadCount() + 1);
                statusRepository.save(status);
            }
        }
    }

    public void sendUnreadNotifications(LocalDateTime cutoff) {

        List<ChatRoomUserUnreadStatus> toNotify = statusRepository.findAllForNotification(cutoff);

        Map<UUID, List<ChatRoomUserUnreadStatus>> groupedByChatRoom = toNotify.stream()
                .collect(Collectors.groupingBy(ChatRoomUserUnreadStatus::getChatRoomId));

        Set<UUID> notifiedUserIds = new HashSet<>();

        for (Map.Entry<UUID, List<ChatRoomUserUnreadStatus>> entry : groupedByChatRoom.entrySet()) {
            UUID chatRoomId = entry.getKey();
            List<ChatRoomUserUnreadStatus> statuses = entry.getValue();

            ChatRoom chatRoom = chatRoomRepository.findById(chatRoomId).orElse(null);
            if (chatRoom == null) {
                return;
            }
            ChatRoomType chatRoomType = chatRoom.getType();

            List<UUID> userIds = statuses.stream()
                    .map(ChatRoomUserUnreadStatus::getUserId)
                    .collect(Collectors.toList());
            List<User> users = userRepository.findAllById(userIds);

            Map<String, Object> data = new HashMap<>();
            data.put("chatRoomId", chatRoomId);

            int unreadCount = statuses.stream()
                    .mapToInt(ChatRoomUserUnreadStatus::getUnreadCount)
                    .sum();

            data.put("unreadCount", unreadCount);
            String plural = unreadCount == 1 ? "" : "s";

            switch (chatRoomType) {
                case AUCTION -> {
                    Auction auction = chatRoom.getAuction();
                    String auctionPartialUrl = String.format(AUCTION_PARTIAL_URL_TEMPLATE, auction.getId());

                    // Find seller among users
                    Optional<User> sellerOpt = users.stream()
                            .filter(u -> u.getRoleEnum() == UserRoleEnum.SELLER)
                            .findFirst();

                    if (sellerOpt.isPresent()) {
                        User seller = sellerOpt.get();

                        String sellerTitle = String.format(SELLER_CHAT_TITLE, auction.getTitle());
                        String sellerMessage = String.format(SELLER_CHAT_MESSAGE, auction.getTitle());

                        singleNotificationPublisher.publishNotificationEvent(
                                sellerTitle,
                                sellerMessage,
                                NotificationCategory.SELLER_AUCTION_CHAT_UNREAD_MESSAGE,
                                seller,
                                auctionPartialUrl
                        );

                        notifiedUserIds.add(seller.getId());

                    }

                    String watcherTitle = String.format(AUCTION_CHAT_TITLE, auction.getTitle());
                    String watcherMessage = String.format(AUCTION_CHAT_MESSAGE, unreadCount, plural, auction.getTitle());

                    List<User> watcherNotifiedUsers = watchListNotifyService.notifySubscribers(
                            auction,
                            users,
                            null,
                            watcherTitle,
                            watcherMessage,
                            NotificationCategory.WATCHER_AUCTION_CHAT_UNREAD_MESSAGE,
                            auctionPartialUrl
                    );

                    notifiedUserIds.addAll(
                            watcherNotifiedUsers.stream().map(User::getId).toList());

                }
                case PRIVATE -> { // 1:1 chats
                    Auction auction = chatRoom.getAuction(); // may be null

                    for (User userToNotify : users) {
                        User otherUser = getPrivateChatOtherUser(chatRoom, userToNotify);
                        String otherUserName = otherUser.getFirstName();

                        String title;
                        String message;

                        if (auction != null) {
                            // there is an auction linked to this private chat
                            UserRoleEnum otherRole = otherUser.getRoleEnum();

                            if (otherRole == UserRoleEnum.SELLER) {
                                title = String.format(SELLER_CHAT_TITLE, auction.getTitle());
                                message = String.format(SELLER_CHAT_MESSAGE, auction.getTitle());
                            } else if (otherRole == UserRoleEnum.BIDDER) {
                                title = String.format(BID_WINNER_CHAT_TITLE, auction.getTitle());
                                message = String.format(BID_WINNER_CHAT_MESSAGE, auction.getTitle());
                            } else {
                                // fallback for unknown role
                                title = String.format(PRIVATE_CHAT_TITLE, otherUserName, auction.getTitle());
                                message = String.format(PRIVATE_CHAT_MESSAGE, otherUserName, auction.getTitle());
                            }
                        } else {
                            title = String.format(PRIVATE_CHAT_TITLE, otherUserName, "private chat");
                            message = String.format(PRIVATE_CHAT_MESSAGE, otherUserName, "private chat");
                        }

                        singleNotificationPublisher.publishNotificationEvent(
                                title,
                                message,
                                NotificationCategory.CHAT_UNREAD_MESSAGE,
                                userToNotify,
                                null
                        );

                        notifiedUserIds.add(userToNotify.getId());
                    }
                }

                case SUPPORT -> {
                    users.stream()
                            .filter(user ->
                                    user.getRoleEnum() != UserRoleEnum.ADMIN &&
                                            user.getRoleEnum() != UserRoleEnum.SUPER_ADMIN
                            )
                            .forEach(user -> {
                                String title = String.format("New Support Message%s", plural);
                                String message = String.format("You have %d unread support message%s.", unreadCount, plural);

                                singleNotificationPublisher.publishNotificationEvent(
                                        title,
                                        message,
                                        NotificationCategory.SUPPORT_CHAT_UNREAD_MESSAGE,
                                        user,
                                        "/support"
                                );

                                notifiedUserIds.add(user.getId());
                            });

                }
                case null, default -> {
                    continue;
                }
            }

            LocalDateTime now = LocalDateTime.now();
            for (ChatRoomUserUnreadStatus status : statuses) {
                if (notifiedUserIds.contains(status.getUserId())) {
                    status.setNotificationCount(status.getNotificationCount() + 1);
                    status.setLastNotifiedAt(now);
                    statusRepository.save(status);
                }
            }
        }
    }


    private User getPrivateChatOtherUser(ChatRoom chatRoom, User currentUser) {
        return chatRoom.getParticipants().stream()
                .filter(u -> !u.getId().equals(currentUser.getId()))
                .findFirst()
                .orElse(null);
    }

}
