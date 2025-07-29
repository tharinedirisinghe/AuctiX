package com.helios.auctix.services;

import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.events.notification.BulkNotificationPublisher;
import com.helios.auctix.repositories.AuctionWatchListRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class WatchListNotifyService {
    private final AuctionWatchListRepository watchRepo;
    private final BulkNotificationPublisher bulkNotificationPublisher;

    public WatchListNotifyService(AuctionWatchListRepository watchRepo, BulkNotificationPublisher bulkNotificationPublisher) {
        this.watchRepo = watchRepo;
        this.bulkNotificationPublisher = bulkNotificationPublisher;
    }

    /**
     * Notifies all users who have subscribed (watchlisted) the given auction.
     * <p>
     * This method retrieves the list of users watching the auction and publishes
     * a bulk notification event to inform them about updates such as changes in
     * auction status, time, or other important events.
     * <p>
     * The bulk notification event is saved in bulk by NotificationManagerService,
     * and then user preferences are resolved and notifications are sent in parallel.
     *
     * @param auction          the auction whose subscribers should be notified
     * @param includeOnlyUsers nullable; if provided, only users in both this list and the watchlist are notified
     * @param excludeUsers     nullable; exclude users from the watchers to get the notification
     * @param title            the title of the notification
     * @param message          the detailed message content to be sent
     * @param category         the notification category
     * @param partialUrl       nullable partial url eg: '/auction-details/adfasdfa3240-242341'
     * @return List<User>      List of notified users
     */

    public List<User> notifySubscribers(
            Auction auction,
            @Nullable List<User> includeOnlyUsers,
            @Nullable List<User> excludeUsers,
            String title,
            String message,
            NotificationCategory category,
            @Nullable String partialUrl
    ) {
        if (auction == null) {
            throw new IllegalArgumentException("Auction cannot be null");
        }

        List<User> users = watchRepo.findUsersWatchingAuction(auction.getId());

        if (includeOnlyUsers != null && !includeOnlyUsers.isEmpty()) {
            Set<UUID> includeIds = includeOnlyUsers.stream()
                    .map(User::getId)
                    .collect(Collectors.toSet());

            users = users.stream()
                    .filter(u -> includeIds.contains(u.getId()))
                    .toList();
        }

        if (excludeUsers != null && !excludeUsers.isEmpty()) {
            Set<UUID> excludeIds = excludeUsers.stream()
                    .map(User::getId)
                    .collect(Collectors.toSet());

            users = users.stream()
                    .filter(u -> !excludeIds.contains(u.getId()))
                    .toList();
        }


        if (users.isEmpty()) {
            log.info("No users to notify for auction: " + auction.getId());
            return users;
        }

        log.info("Notifying users watching auction " + auction.getId() + ": " + users.stream()
                .map(User::getUsername)
                .toList());

        bulkNotificationPublisher.publish(users, title, message, category, partialUrl);

        return users;
    }


}
