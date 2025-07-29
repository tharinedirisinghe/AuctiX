package com.helios.auctix.repositories.chat;

import com.helios.auctix.domain.chat.ChatRoomUserUnreadStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ChatRoomUserUnreadStatusRepository extends JpaRepository<ChatRoomUserUnreadStatus, ChatRoomUserUnreadStatus.ChatRoomUserUnreadStatusId> {

    List<ChatRoomUserUnreadStatus> findByChatRoomId(UUID chatRoomId);

    List<ChatRoomUserUnreadStatus> findByUserId(UUID userId);

    @Query("""
    SELECT s FROM ChatRoomUserUnreadStatus s
        WHERE s.unreadCount > 0
          AND (s.notificationCount = 0 OR s.lastNotifiedAt < s.lastReadTimestamp)
          AND (s.lastReadTimestamp IS NULL OR s.lastReadTimestamp < :cutoff)
    """)
    List<ChatRoomUserUnreadStatus> findAllForNotification(@Param("cutoff") LocalDateTime cutoff);

    @Query("""
        SELECT s FROM ChatRoomUserUnreadStatus s
        WHERE s.chatRoomId = :chatRoomId AND s.userId = :userId
    """)
    ChatRoomUserUnreadStatus findByChatRoomIdAndUserId(@Param("chatRoomId") UUID chatRoomId, @Param("userId") UUID userId);

    @Modifying
    @Query("""
        UPDATE ChatRoomUserUnreadStatus s
        SET s.unreadCount = s.unreadCount + 1
        WHERE s.chatRoomId = :chatRoomId
          AND s.userId <> :senderId
        """)
    int incrementUnreadCountForOthers(
            @Param("chatRoomId") UUID chatRoomId,
            @Param("senderId") UUID senderId);

}
