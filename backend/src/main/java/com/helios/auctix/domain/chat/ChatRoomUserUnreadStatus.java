package com.helios.auctix.domain.chat;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "chat_room_user_unread_status")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(ChatRoomUserUnreadStatus.ChatRoomUserUnreadStatusId.class)
public class ChatRoomUserUnreadStatus {

    @Id
    @Column(name = "chat_room_id")
    private UUID chatRoomId;

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "unread_count", nullable = false)
    private Integer unreadCount = 0;

    @Column(name = "last_read_timestamp")
    private LocalDateTime lastReadTimestamp;

    @Column(name = "last_notified_at")
    private LocalDateTime lastNotifiedAt;

    @Column(name = "notification_count", nullable = false)
    private Integer notificationCount = 0;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ChatRoomUserUnreadStatusId implements Serializable {
        private UUID chatRoomId;
        private UUID userId;
    }
}
