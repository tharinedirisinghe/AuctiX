package com.helios.auctix.config;

import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.notification.NotificationCategoryGroup;
import com.helios.auctix.domain.notification.NotificationCategoryMetadata;
import com.helios.auctix.domain.notification.NotificationCategoriesConfig;
import com.helios.auctix.domain.user.UserRoleEnum;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class NotificationCategoryLoader {

    private final NotificationCategoriesConfig config;

    @PostConstruct
    public void init() {
        Map<String, NotificationCategoryMetadata> metaMap = config.getNotificationCategories();

        for (NotificationCategory category : NotificationCategory.values()) {
            NotificationCategoryMetadata meta = metaMap.get(category.name());

            if (meta == null) {
                System.out.println("WARNING: Missing notification config for " + category.name() + ", applying default values.");

                category.setCategoryGroup(NotificationCategoryGroup.DEFAULT);
                category.setTitle(category.name() + " Notification");
                category.setDescription("No description provided");
                category.setAllowedRoles(Set.of(UserRoleEnum.values()));
                category.setCannotEditRoles(Set.of());
                category.setAlwaysHiddenRoles(Set.of());
                category.setBypassSettingsRoles(Set.of());
                continue;
            }
            category.setTitle(meta.getTitle());
            category.setDescription(meta.getDescription());
            category.setCategoryGroup(meta.getCategoryGroup());
            category.setAllowedRoles(meta.getAllowedRoles());
            category.setCannotEditRoles(meta.getCannotEditRoles());
            category.setAlwaysHiddenRoles(meta.getAlwaysHiddenRoles());
            category.setBypassSettingsRoles((meta.getBypassSettingsRoles()));
        }
    }
}
