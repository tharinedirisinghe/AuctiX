package com.helios.auctix.domain.notification;
import com.helios.auctix.domain.user.UserRoleEnum;
import lombok.Getter;

import java.util.Set;


@Getter
public enum NotificationCategory {
    /**
     * DEFAULT is used to send the notification via all the available senders
     */
//    DEFAULT("Default Notifications", "All other notifications", NotificationCategoryGroup.DEFAULT),
//    PROMO("Promotional Notifications", "Marketing notifications about promotions, discounts", NotificationCategoryGroup.PROMO),
//    AUCTION_START_SOON("Auction Start soon", "Get notified 10 minutes before auction starts", NotificationCategoryGroup.AUCTION),
//    AUCTION_END_SOON("Auction Ends soon", "Get notified 10 minutes before auction ends", NotificationCategoryGroup.AUCTION),
//    AUCTION_COMPLETED("Auction Completed", "Get notified when auction ends", NotificationCategoryGroup.AUCTION),
//    AUCTION_WON("Auction Won", "Get notified after winning an auction", NotificationCategoryGroup.AUCTION),
//    USER_REPORTED("User is reported", "Get a notification when a user gets reported",
//            NotificationCategoryGroup.DEFAULT,
//            Set.of(UserRoleEnum.ADMIN, UserRoleEnum.SUPER_ADMIN));

    DEFAULT,
    PROMO,

    AUCTION_START_SOON,
    AUCTION_END_SOON,
    AUCTION_COMPLETED,
    AUCTION_STARTED,
    AUCTION_WON,
    AUCTION_UPDATED,
    AUCTION_CANCELED,
    OUTBID,
    ITEM_SOLD,
    NEW_BID_RECEIVED_SELLER,
    NEW_BID_RECEIVED_WATCHER,

    WELCOME_MESSAGE,
    ACCOUNT_SUSPENDED,
    ACCOUNT_REINSTATED,

    WALLET_RECHARGE_SUCCESS,
    WALLET_WITHDRAWAL_SUCCESS,

    CHAT_UNREAD_MESSAGE,
    SUPPORT_CHAT_UNREAD_MESSAGE,
    WATCHER_AUCTION_CHAT_UNREAD_MESSAGE,
    SELLER_AUCTION_CHAT_UNREAD_MESSAGE;

    private String title;
    private String description;
    private NotificationCategoryGroup categoryGroup;
    // Which roles can receive this notification
    private Set<UserRoleEnum> allowedRoles;

    // Which roles cannot change their preference (cannot disable)
    private Set<UserRoleEnum> cannotEditRoles;

    // Which roles never see this notification in their preferences UI
    private Set<UserRoleEnum> alwaysHiddenRoles;

    // Roles for whom this notification bypasses global channel settings
    private Set<UserRoleEnum> bypassSettingsRoles;

    // Constructor for default: all roles allowed
    NotificationCategory(String title, String description, NotificationCategoryGroup group) {
        this(title, description, group, Set.of(UserRoleEnum.values())); // all roles for default
    }

    // Constructor for restricted roles
    NotificationCategory(String title, String description, NotificationCategoryGroup group, Set<UserRoleEnum> allowedRoles) {
        this.title = title;
        this.description = description;
        this.categoryGroup = group;
        this.allowedRoles = allowedRoles;
    }

    NotificationCategory() {
    }

    public boolean isNotAllowedTo(UserRoleEnum role) {
        return !allowedRoles.contains(role);
    }

    public boolean isEditableBy(UserRoleEnum role) {
        return !cannotEditRoles.contains(role);
    }

    public boolean isHiddenFrom(UserRoleEnum role) {
        return alwaysHiddenRoles.contains(role);
    }

    // Setters for all fields (to be called from loader)
    public void setTitle(String title) { this.title = title; }
    public void setDescription(String description) { this.description = description; }
    public void setCategoryGroup(NotificationCategoryGroup categoryGroup) { this.categoryGroup = categoryGroup; }
    public void setAllowedRoles(Set<UserRoleEnum> allowedRoles) { this.allowedRoles = allowedRoles; }
    public void setCannotEditRoles(Set<UserRoleEnum> cannotEditRoles) { this.cannotEditRoles = cannotEditRoles; }
    public void setAlwaysHiddenRoles(Set<UserRoleEnum> alwaysHiddenRoles) { this.alwaysHiddenRoles = alwaysHiddenRoles; }
    public void setBypassSettingsRoles(Set<UserRoleEnum> bypassSettingsRoles) {this.bypassSettingsRoles = bypassSettingsRoles;}
}
