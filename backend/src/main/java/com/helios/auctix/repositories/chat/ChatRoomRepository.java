package com.helios.auctix.repositories.chat;

import com.helios.auctix.domain.chat.ChatRoom;
import com.helios.auctix.domain.chat.ChatRoomType;
import com.helios.auctix.domain.user.UserRole;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ChatRoomRepository extends CrudRepository<ChatRoom, UUID> {

    @Modifying
    @Transactional
    @Query(value = "INSERT INTO chat_room_participants (chat_room_id, user_id) VALUES (:chatRoomId, :userId) ON CONFLICT DO NOTHING", nativeQuery = true)
    void addUserToChatRoom(UUID chatRoomId, UUID userId);

    Optional<ChatRoom> findChatRoomByAuctionId(UUID auctionId);

    @Query(value = "SELECT EXISTS(SELECT 1 FROM chat_room_participants WHERE chat_room_id = :chatRoomId AND user_id = :userId)", nativeQuery = true)
    boolean isUserMemberOfChatRoom(UUID chatRoomId, UUID userId);

    @Query("""
        SELECT cr FROM ChatRoom cr
        JOIN cr.participants p
        WHERE cr.type = :type AND p.id = :userId
    """)
    Optional<ChatRoom> findSupportChatByUserId(@Param("userId") UUID userId, @Param("type") ChatRoomType type);

    default Optional<ChatRoom> findSupportChatByUserId(UUID userId) {
        return findSupportChatByUserId(userId, ChatRoomType.SUPPORT);
    }

    @Query(
        value = """
        SELECT cr.id AS chatId, u.id AS userId, u.username, u.email, u.first_name, u.last_name, ur.role_name AS role
        FROM chat_rooms cr
        JOIN chat_room_participants crp ON cr.id = crp.chat_room_id
        JOIN users u ON crp.user_id = u.id
        JOIN user_roles ur ON u.role_id = ur.id
        JOIN (
            SELECT cm.chat_room_id, MAX(cm.timestamp) AS latest_timestamp
            FROM chat_messages cm
            GROUP BY cm.chat_room_id
        ) latest ON latest.chat_room_id = cr.id
        WHERE cr.chat_room_type = 'SUPPORT'
        AND (ur.role_name = 'SELLER' OR ur.role_name = 'BIDDER')
        AND (
            LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.first_name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.last_name) LIKE LOWER(CONCAT('%', :search, '%'))
        )
        ORDER BY latest.latest_timestamp DESC
        LIMIT :limit OFFSET :offset
        """,
        nativeQuery = true
    )
    List<Object[]> findSupportChatsNative(
            @Param("search") String search,
            @Param("limit") int limit,
            @Param("offset") int offset
    );
    
    @Query("""
        SELECT cr FROM ChatRoom cr
        JOIN cr.participants p1
        JOIN cr.participants p2
        WHERE cr.type = 'PRIVATE'
          AND cr.auction.id = :auctionId
          AND p1.id = :sellerId
          AND p2.id = :winnerId
    """)
    Optional<ChatRoom> findPrivateChatBetweenForAuction(
            @Param("sellerId") UUID sellerId,
            @Param("winnerId") UUID winnerId,
            @Param("auctionId") UUID auctionId
    );



    @Query(value = """
        SELECT
            cr.id AS chat_room_id,
            cr.chat_room_type,
            cr.auction_id,
            cr.created_at,
            cr.updated_at,
            COALESCE(s.unread_count, 0) AS unread_count,
            COALESCE(s.notification_count, 0) AS notification_count,
            a.title AS auction_title,
            CASE
                WHEN cr.chat_room_type = 'PRIVATE' THEN u.username
                ELSE NULL
            END AS username,
            u.first_name,
            u.last_name,
            ur.role_name AS role,
            latest.latest_timestamp
        FROM chat_rooms cr
        JOIN chat_room_participants p ON cr.id = p.chat_room_id
        LEFT JOIN chat_room_user_unread_status s ON cr.id = s.chat_room_id AND s.user_id = :userId
        LEFT JOIN auctions a ON cr.auction_id = a.id
        LEFT JOIN users u ON u.id = (
            SELECT p2.user_id
            FROM chat_room_participants p2
            WHERE p2.chat_room_id = cr.id AND p2.user_id != :userId
            LIMIT 1
        )
        LEFT JOIN user_roles ur ON u.role_id = ur.id
        LEFT JOIN (
            SELECT
                cm.chat_room_id,
                MAX(cm.timestamp) AS latest_timestamp
            FROM chat_messages cm
            GROUP BY cm.chat_room_id
        ) latest ON latest.chat_room_id = cr.id
        WHERE p.user_id = :userId
          AND (:chatRoomType IS NULL OR cr.chat_room_type = :chatRoomType)
          AND (
            :tsQuery IS NULL OR (
                (cr.chat_room_type IN ('PRIVATE', 'SUPPORT') AND (
                    LOWER(u.username) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
                    OR LOWER(u.first_name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
                    OR LOWER(u.last_name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
                ))
                OR
                (cr.chat_room_type = 'AUCTION' AND a.search_vector @@ to_tsquery('english', :tsQuery))
            )
          )
        GROUP BY
            cr.id,
            s.unread_count,
            s.notification_count,
            a.title,
            u.username,
            u.first_name,
            u.last_name,
            ur.role_name,
            latest.latest_timestamp,
            cr.chat_room_type
        ORDER BY latest.latest_timestamp DESC NULLS LAST
        LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
    List<Object[]> searchUserChatRooms(
            @Param("userId") UUID userId,
            @Param("searchTerm") String searchTerm,
            @Param("tsQuery") String tsQuery,
            @Param("chatRoomType") String chatRoomType,
            @Param("limit") int limit,
            @Param("offset") int offset
    );





}
