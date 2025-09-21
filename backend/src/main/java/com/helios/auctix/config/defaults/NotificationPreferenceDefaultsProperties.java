package com.helios.auctix.config.defaults;

import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.notification.NotificationType;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.Setter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Loads notification preference defaults from configuration,
 * and applies fallback values as necessary.
 */
@Component
@ConfigurationProperties(prefix = "notification.defaults")
public class NotificationPreferenceDefaultsProperties {

    private static final Logger logger = LoggerFactory.getLogger(NotificationPreferenceDefaultsProperties.class);
    private static final boolean ULTIMATE_FALLBACK_VALUE = true;

    /**
     * Global notification defaults from configuration in application.properties.
     * We can override .properties automatically with environment variables in prod if needed
     * Example: notification.defaults.global.EMAIL=true
     *
     * Event-specific defaults from configuration in application.properties.
     * We can override .properties automatically with environment variables in prod if needed
     * Example: notification.defaults.events.PROMO.EMAIL=true
     *
     */
    @Getter @Setter
    private Map<String, Boolean> global = new HashMap<>();

    @Getter @Setter
    private Map<String, Map<String, Boolean>> events = new HashMap<>();

    private final Map<NotificationType, Boolean> DEFAULT_GLOBAL_PREFERENCES = Map.of(
            NotificationType.EMAIL, true,
            NotificationType.PUSH, true
    );

    private final Map<NotificationCategory, Map<NotificationType, Boolean>> DEFAULT_CATEGORY_PREFERENCES = Map.of(
            NotificationCategory.PROMO, Map.of(
                    NotificationType.EMAIL, true,
                    NotificationType.PUSH, false
            ),
            NotificationCategory.OUTBID, Map.of(
                    NotificationType.EMAIL, true,
                    NotificationType.PUSH, true
            ),
            NotificationCategory.DEFAULT, Map.of(
                    NotificationType.EMAIL, true,
                    NotificationType.PUSH, true
            )
    );

    @PostConstruct
    public void initializeDefaults() {
        applyGlobalFallbacks();
        applyEventFallbacks();
        logger.info("Initialized global notification defaults: {}", global);
        logger.info("Initialized event-specific notification defaults: {}", events);    }

    /**
     * Get the resolved default preferences for all categories and notification types.
     */
    public Map<String, Map<String, Boolean>> getResolvedEventDefaults() {
        Map<String, Map<String, Boolean>> resolved = new HashMap<>();

        // Add all known notification categories
        for (NotificationCategory category : NotificationCategory.values()) {
            resolved.put(category.name(), resolveCategoryDefaults(category.name()));
        }

        // Handle unknown category keys in config
        for (String categoryKey : events.keySet()) {
            if (!resolved.containsKey(categoryKey)) {
                logger.warn("Unknown NotificationCategory '{}'. Applying DEFAULT fallbacks.", categoryKey);
                resolved.put(categoryKey, resolveCategoryDefaults(categoryKey));
            }
        }

        return resolved;
    }


    private void applyGlobalFallbacks() {
        for (NotificationType type : NotificationType.values()) {
            String typeKey = type.name();
            global.putIfAbsent(typeKey,
                    DEFAULT_GLOBAL_PREFERENCES.getOrDefault(type, ULTIMATE_FALLBACK_VALUE));
        }
    }

    private void applyEventFallbacks() {
        for (NotificationCategory category : NotificationCategory.values()) {
            String categoryKey = category.name();

            // For all the notification categories defined in enum we set resolve the defaults
            events.putIfAbsent(categoryKey, new HashMap<>());
            Map<String, Boolean> merged = resolveCategoryDefaults(categoryKey);
            events.put(categoryKey, merged);
        }

        // Handle unknown category keys
        for (String categoryKey : events.keySet()) {
            if (!isKnownCategory(categoryKey)) {
                logger.warn("Unknown NotificationCategory '{}'. Applying DEFAULT fallbacks.", categoryKey);
                Map<String, Boolean> merged = resolveCategoryDefaults(categoryKey);
                events.put(categoryKey, merged);
            }
        }
    }

    private boolean isKnownCategory(String categoryKey) {
        for (NotificationCategory category : NotificationCategory.values()) {
            if (category.name().equals(categoryKey)) return true;
        }
        return false;
    }

    private Map<String, Boolean> resolveCategoryDefaults(String categoryKey) {
        // Step 1: Load config overrides if any
        Map<String, Boolean> configValues = events.getOrDefault(categoryKey, new HashMap<>());

        // Step 2: Load hardcoded fallbacks
        Map<NotificationType, Boolean> fallbackValues = getHardcodedCategoryFallbacks(categoryKey);

        // Step 3: Merge hardcoded fallbacks, then override with config
        Map<String, Boolean> merged = convertToStringKeyMap(fallbackValues);
        merged.putAll(configValues);

        // Step 4: Fill any missing notification sending types with defaults (type defined in NotificationType enum but has no defaults defined in config or hardcoded)
        ensureAllNotificationTypesPresent(categoryKey, merged);

        return merged;
    }

    private Map<NotificationType, Boolean> getHardcodedCategoryFallbacks(String categoryKey) {
        try {
            NotificationCategory category = NotificationCategory.valueOf(categoryKey);
            return DEFAULT_CATEGORY_PREFERENCES.getOrDefault(category,
                    DEFAULT_CATEGORY_PREFERENCES.get(NotificationCategory.DEFAULT));
        } catch (IllegalArgumentException e) {
            logger.warn("Category '{}' is not a known enum. Using DEFAULT fallback.", categoryKey);
            return DEFAULT_CATEGORY_PREFERENCES.get(NotificationCategory.DEFAULT);
        }
    }

    private void ensureAllNotificationTypesPresent(String categoryKey, Map<String, Boolean> merged) {
        for (NotificationType type : NotificationType.values()) {
            String typeKey = type.name();
            merged.putIfAbsent(typeKey, global.getOrDefault(typeKey, ULTIMATE_FALLBACK_VALUE));
        }
    }

    private Map<String, Boolean> convertToStringKeyMap(Map<NotificationType, Boolean> input) {
        return input.entrySet().stream()
                .collect(Collectors.toMap(
                        e -> e.getKey().name(),
                        Map.Entry::getValue,
                        (a, b) -> b,
                        HashMap::new
                ));
    }

    public Set<NotificationType> getEnabledDefaultNotificationTypesForCategory(NotificationCategory category) {
        Map<String, Boolean> typeMap = resolveCategoryDefaults(category.name());

        return typeMap.entrySet().stream()
                .filter(Map.Entry::getValue) // Only include enabled types
                .map(Map.Entry::getKey)
                .map(typeStr -> {
                    try {
                        return NotificationType.valueOf(typeStr);
                    } catch (IllegalArgumentException e) {
                        logger.warn("Unknown NotificationType '{}'", typeStr);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }

    public Set<NotificationType> getEnabledGlobalDefaults() {
        return global.entrySet().stream()
                .filter(entry -> Boolean.TRUE.equals(entry.getValue()))
                .map(Map.Entry::getKey)
                .map(typeStr -> {
                    try {
                        return NotificationType.valueOf(typeStr);
                    } catch (IllegalArgumentException e) {
                        logger.warn("Unknown NotificationType '{}' in global defaults", typeStr);
                        return null;
                    }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
    }


}
