package com.helios.auctix.services.notification;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.helios.auctix.config.defaults.NotificationPreferenceDefaultsProperties;
import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.notification.NotificationType;
import com.helios.auctix.domain.notification.preferences.NotificationEventPreference;
import com.helios.auctix.domain.notification.preferences.NotificationGlobalPreference;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.dtos.notification.NotificationPreferenceUpdateDto;
import com.helios.auctix.dtos.notification.NotificationPreferencesResponseDto;
import com.helios.auctix.mappers.NotificationPreferenceResponseDTOMapper;
import com.helios.auctix.repositories.NotificationEventPreferencesRepository;
import com.helios.auctix.repositories.NotificationGlobalPreferencesRepository;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class NotificationSettingsService {


    private final NotificationGlobalPreferencesRepository notificationGlobalPreferencesRepository;
    private final NotificationEventPreferencesRepository notificationEventPreferencesRepository;
    private final NotificationPreferenceResponseDTOMapper preferencesDTOMapper;
    private final NotificationPreferenceDefaultsProperties preferenceDefaultsProperties;
    private final ObjectMapper objectMapper;

    public NotificationSettingsService(
            NotificationGlobalPreferencesRepository notificationGlobalPreferencesRepository,
            NotificationEventPreferencesRepository notificationEventPreferencesRepository,
            NotificationPreferenceResponseDTOMapper preferencesDTOMapper,
            ObjectMapper objectMapper,
            NotificationPreferenceDefaultsProperties preferenceDefaultsProperties) {
        this.notificationGlobalPreferencesRepository = notificationGlobalPreferencesRepository;
        this.notificationEventPreferencesRepository = notificationEventPreferencesRepository;
        this.preferencesDTOMapper = preferencesDTOMapper;
        this.objectMapper = objectMapper;
        this.preferenceDefaultsProperties = preferenceDefaultsProperties;
    }

    public Set<NotificationType> resolveNotificationPreference(NotificationCategory category, User user) {
        Set<NotificationType> enabledNotificationTypesForEvent = new HashSet<>();
        Set<NotificationType> globallyEnabledNotificationTypes = new HashSet<>();

        // sanity check
        if (category.isNotAllowedTo(user.getRoleEnum())) {
            return Collections.emptySet();
        }

        if (category.getBypassSettingsRoles().contains(user.getRoleEnum())) {
            return EnumSet.allOf(NotificationType.class); // send via all types (EMAIL, PUSH)
        }

        try {

            // Check the preferences for event categories
            Optional<NotificationEventPreference> eventPreference = notificationEventPreferencesRepository.findByUserId(user.getId());
            if (eventPreference.isPresent()) {
                // settings will be a string of   {"PROMO" : { "EMAIL": true, "PUSH": false }, "BID_WIN" : { "EMAIL": true, "PUSH": false } }
                Map<NotificationCategory, Map<NotificationType, Boolean>> eventPreferenceSettings = getSettingsNotificationTypesForEventCategories(eventPreference.get().getSettings());

                Map<NotificationType, Boolean> categorySettings = eventPreferenceSettings.get(category);
                if (categorySettings != null) {
                    for (Map.Entry<NotificationType, Boolean> entry : categorySettings.entrySet()) {
                        if (Boolean.TRUE.equals(entry.getValue())) {
                            enabledNotificationTypesForEvent.add(entry.getKey());
                        }
                    }
                }
            } else {
                // fall back is default notification preferences when there is no event category settings
                log.info( "Fallback to default preferences for category");
                enabledNotificationTypesForEvent = preferenceDefaultsProperties.getEnabledDefaultNotificationTypesForCategory(category);
            }

            // Get the global notification preferences set for the user
            Optional<NotificationGlobalPreference> globalPreference = notificationGlobalPreferencesRepository.findByUserId(user.getId());
            if (globalPreference.isPresent()) {
                Map<NotificationType, Boolean> globalNotificationPreference = getSettingsGlobalNotificationPreference(globalPreference.get().getSettings());

                globallyEnabledNotificationTypes = globalNotificationPreference.entrySet().stream()
                        .filter(entry -> Boolean.TRUE.equals(entry.getValue()))
                        .map(Map.Entry::getKey) // get the NotificationType
                        .collect(Collectors.toSet());
            } else {
                log.info("Fallback to default global preferences");
                globallyEnabledNotificationTypes = preferenceDefaultsProperties.getEnabledGlobalDefaults();
            }

            // if a NotificationType is missing in the user's settings string we have to handle it by checking if that is enabled in the default preferences
            for (NotificationType type : NotificationType.values()) {

                // Check missing in event preferences
                if (eventPreference.isPresent()) {
                    Map<NotificationCategory, Map<NotificationType, Boolean>> eventPreferenceSettings = getSettingsNotificationTypesForEventCategories(eventPreference.get().getSettings());
                    Map<NotificationType, Boolean> categorySettings = eventPreferenceSettings.get(category);
                    if (categorySettings == null || !categorySettings.containsKey(type)) {
                        // Missing: check default for this category and add if enabled
                        Set<NotificationType> defaultEventTypes = preferenceDefaultsProperties.getEnabledDefaultNotificationTypesForCategory(category);
                        if (defaultEventTypes.contains(type)) {
                            enabledNotificationTypesForEvent.add(type);
                        }
                    }
                } else {
                    // No event preference, already fallback to default earlier
                }

                // Check missing NotificationType in global preferences
                if (globalPreference.isPresent()) {
                    Map<NotificationType, Boolean> globalNotificationPreference = getSettingsGlobalNotificationPreference(globalPreference.get().getSettings());
                    if (!globalNotificationPreference.containsKey(type)) {
                        // Missing NotificationType: check default global preferences and add if enabled
                        Set<NotificationType> defaultGlobalTypes = preferenceDefaultsProperties.getEnabledGlobalDefaults();
                        if (defaultGlobalTypes.contains(type)) {
                            globallyEnabledNotificationTypes.add(type);
                        }
                    }
                } else {
                    // No global preference, fallback to default global preferences already done earlier
                }
            }

            // Filter so that global preference overrides, event preference
            // Only include notification types that are enabled both at event level and globally
            return enabledNotificationTypesForEvent.stream()
                    .filter(globallyEnabledNotificationTypes::contains)
                    .collect(Collectors.toSet());


        } catch (JsonProcessingException e) {
            log.error("Error resolving notification preferences for user {} for category {}. Falling back to defaults. Error: {}", user.getUsername(), category, e.getMessage());
//            e.printStackTrace();
            return preferenceDefaultsProperties.getEnabledDefaultNotificationTypesForCategory(category);
        }
    }

    /**
     * Get the preferences of the user for the event categories
     *
     * @param settingsJsonString event notification settings as a json format similar to - {"PROMO" : { "EMAIL": true, "PUSH": false }, "BID_WIN" : { "EMAIL": true, "PUSH": false } }
     * @return Map<NotificationCategory, Map < NotificationType, Boolean>> eventCategoryNotificationSettings
     * @throws JsonProcessingException
     */
    private Map<NotificationCategory, Map<NotificationType, Boolean>> getSettingsNotificationTypesForEventCategories(String settingsJsonString) throws JsonProcessingException {
        Map<NotificationCategory, Map<NotificationType, Boolean>> settings = new HashMap<>();

        return objectMapper.readValue(
                settingsJsonString,
                new TypeReference<Map<NotificationCategory, Map<NotificationType, Boolean>>>() {
                }
        );
    }

    /**
     * Get the global preferences of the user for notification delivery types
     *
     * @param settingsJsonString global notification settings as a json in a format similar to - { "EMAIL" : true, "PUSH": false }
     * @return Map<NotificationType, Boolean> globalNotificationSettings
     * @throws JsonProcessingException
     */
    private Map<NotificationType, Boolean> getSettingsGlobalNotificationPreference(String settingsJsonString) throws JsonProcessingException {
        Map<NotificationType, Boolean> settings = new HashMap<>();

        return objectMapper.readValue(
                settingsJsonString,
                new TypeReference<Map<NotificationType, Boolean>>() {
                }
        );
    }

    @Deprecated
    private Map<NotificationCategory, Set<NotificationType>> setDefaultPreferences() {
        Map<NotificationCategory, Set<NotificationType>> defaultPreferences = new HashMap<>();

        // Set default preferences like this for now
        defaultPreferences.put(NotificationCategory.DEFAULT, Set.of(
                NotificationType.EMAIL,
//                NotificationType.WEBSOCKET,
                NotificationType.PUSH
        ));

        defaultPreferences.put(NotificationCategory.PROMO, Set.of(
                NotificationType.EMAIL,
                NotificationType.PUSH
        ));

        return defaultPreferences;
    }

    public void savePreferences(User user, @Valid NotificationPreferenceUpdateDto dto) {
        UserRoleEnum role = user.getRoleEnum();

        if (dto.getGlobal() != null) {
            // Validate global types/channels
            Map<String, Boolean> validGlobalSettings = dto.getGlobal().entrySet().stream()
                    .filter(entry -> isValidNotificationType(entry.getKey()))
                    .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

            String globalSettingsJson = toJson(validGlobalSettings);

            NotificationGlobalPreference existingGlobalPref = notificationGlobalPreferencesRepository
                    .findByUserId(user.getId())
                    .orElse(NotificationGlobalPreference.builder().user(user).build());

            existingGlobalPref.setSettings(globalSettingsJson);
            notificationGlobalPreferencesRepository.save(existingGlobalPref);
        }

        if (dto.getEvents() != null) {
            Map<String, Map<String, Boolean>> filteredEvents = new HashMap<>();

            for (Map.Entry<String, Map<String, Boolean>> eventEntry : dto.getEvents().entrySet()) {
                String categoryStr = eventEntry.getKey();
                NotificationCategory category;

                try {
                    category = NotificationCategory.valueOf(categoryStr);
                } catch (IllegalArgumentException e) {
                    // Unknown category - skip
                    continue;
                }

                // Check the permissions for the category
                if (category.isNotAllowedTo(role) || category.isHiddenFrom(role)  || !category.isEditableBy(role)) {
                    continue;
                }

                // Filter valid notification types/channels inside this category
                Map<String, Boolean> filteredChannels = eventEntry.getValue().entrySet().stream()
                        .filter(chEntry -> isValidNotificationType(chEntry.getKey()))
                        .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

                if (!filteredChannels.isEmpty()) {
                    filteredEvents.put(categoryStr, filteredChannels);
                }
            }

            if (!filteredEvents.isEmpty()) {
                String eventSettingsJson = toJson(filteredEvents);

                NotificationEventPreference existingEventPref = notificationEventPreferencesRepository
                        .findByUserId(user.getId())
                        .orElse(NotificationEventPreference.builder().user(user).build());

                existingEventPref.setSettings(eventSettingsJson);
                notificationEventPreferencesRepository.save(existingEventPref);
            }
        }
    }

    /**
     * Checks if the Notification Delivery Channel Type exists in the application
     * @param type Notification Delivery Channel Type
     * @return true if valid channel type
     */
    private boolean isValidNotificationType(String type) {
        try {
            NotificationType.valueOf(type);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    private String toJson(Object obj) {
        try {
            return new ObjectMapper().writeValueAsString(obj);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize notification preferences", e);
        }
    }

     public NotificationPreferencesResponseDto getPreferences(User user) {

        Optional<NotificationEventPreference> eventPreferenceOptional = notificationEventPreferencesRepository.findByUserId(user.getId());
        Optional<NotificationGlobalPreference> globalPreferenceOptional = notificationGlobalPreferencesRepository.findByUserId(user.getId());

         // Set as null if no preference exist, the NotificationPreferencesResponseDtoMapper will handle the null and replace with the default preferences
         NotificationEventPreference eventPreference = eventPreferenceOptional.orElse(null);
         NotificationGlobalPreference globalPreference = globalPreferenceOptional.orElse(null);

         // Sanity check / filter: ensure only categories allowed for this role are passed to mapper
         UserRoleEnum role = user.getRoleEnum();

         return preferencesDTOMapper.toDTO(globalPreference, eventPreference, role);
     }
}
