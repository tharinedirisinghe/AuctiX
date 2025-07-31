package com.helios.auctix.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ChatRoomSearchResultDTO {

    private UUID chatRoomId;
    private String chatRoomType;
    private UUID auctionId;
    private Timestamp createdAt;
    private Timestamp updatedAt;
    private int unreadCount;
    private int notificationCount;

    // Optional depending on chat type
    private String auctionTitle;
    private String username;
    private String firstName;
    private String lastName;
    private String role;

}
