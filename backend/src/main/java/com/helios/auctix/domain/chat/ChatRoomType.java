package com.helios.auctix.domain.chat;

public enum ChatRoomType {
    AUCTION,
    PRIVATE,   // 1:1 between users
    SUPPORT,   // User and admin conversations
    GROUP      // general group chat
}