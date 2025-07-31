package com.helios.auctix.domain.notification;

import com.helios.auctix.domain.user.UserRoleEnum;
import lombok.Getter;

import java.util.Set;

/**
 *  Notification categories can be grouped together for example AUCTION group could have AUCTION_START, AUCTION_END, AUCTION_STARTS_SOON etc
 */
@Getter
public enum NotificationCategoryGroup {

    DEFAULT,
    PROMO(Set.of(UserRoleEnum.BIDDER, UserRoleEnum.SELLER)),
    AUCTION,
    SYSTEM,
    WALLET(Set.of(UserRoleEnum.BIDDER, UserRoleEnum.SELLER)),
    CHAT,
    SUPPORT;


    private final Set<UserRoleEnum> allowedRoles;


    NotificationCategoryGroup() {
        this(Set.of(UserRoleEnum.values())); // by default everyone
    }

    NotificationCategoryGroup(Set<UserRoleEnum> allowedRoles) {
        this.allowedRoles = allowedRoles;
    }


    public boolean isNotAllowedTo(UserRoleEnum role) {
        return !allowedRoles.contains(role);
    }
}
