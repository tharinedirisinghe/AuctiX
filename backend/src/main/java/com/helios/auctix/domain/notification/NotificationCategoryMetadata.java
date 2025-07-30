package com.helios.auctix.domain.notification;

import com.helios.auctix.domain.user.UserRoleEnum;
import lombok.Data;
import java.util.Set;

@Data
public class NotificationCategoryMetadata {
    private String title;
    private String description;
    private NotificationCategoryGroup categoryGroup;
    private Set<UserRoleEnum> allowedRoles;
    private Set<UserRoleEnum> cannotEditRoles;
    private Set<UserRoleEnum> alwaysHiddenRoles;
    private Set<UserRoleEnum> bypassSettingsRoles;
}
