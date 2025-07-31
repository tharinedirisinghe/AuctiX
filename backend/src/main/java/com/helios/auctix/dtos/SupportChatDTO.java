package com.helios.auctix.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupportChatDTO {
    private UUID chatId;
    private UUID userId;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private int unreadCount;
}
