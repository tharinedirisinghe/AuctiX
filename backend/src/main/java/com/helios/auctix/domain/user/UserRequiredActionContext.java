package com.helios.auctix.domain.user;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

@Getter
@Builder
@AllArgsConstructor
@NoArgsConstructor(force = true)  // needed for Jackson deserialization of immutable fields
public class UserRequiredActionContext {

    // Remove ObjectMapper from fields, it shouldn't be part of the serialized object
    private static final ObjectMapper DEFAULT_MAPPER = new ObjectMapper();

    private final String title;
    private final String content;
    private final UserRequiredActionSeverityLevelEnum severityLevel;
    private final boolean canResolve;
    private final String triggerUrl;
    private final String continueUrl;

    public String toJson() {
        try {
            return DEFAULT_MAPPER.writeValueAsString(this);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to convert UserRequiredActionContext to JSON", e);
        }
    }

    public Map<String, Object> toMap() {
        try {
            return DEFAULT_MAPPER.convertValue(this, new TypeReference<Map<String, Object>>() {});
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Failed to convert UserRequiredActionContext to Map", e);
        }
    }

    public static UserRequiredActionContext fromJson(String json) {
        try {
            return DEFAULT_MAPPER.readValue(json, UserRequiredActionContext.class);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to parse JSON to UserRequiredActionContext", e);
        }
    }
}
