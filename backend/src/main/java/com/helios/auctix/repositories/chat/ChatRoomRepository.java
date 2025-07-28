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

//    @Query("""
//        SELECT DISTINCT cr FROM ChatRoom cr
//        JOIN cr.participants p
//        WHERE cr.type = 'SUPPORT'
//          AND p.role.name IN ('SELLER', 'BIDDER')
//          AND (
//            :search IS NULL OR :search = ''
//            OR LOWER(p.username) LIKE LOWER(CONCAT('%', :search, '%'))
//            OR LOWER(p.firstName) LIKE LOWER(CONCAT('%', :search, '%'))
//            OR LOWER(p.lastName) LIKE LOWER(CONCAT('%', :search, '%'))
//            OR LOWER(p.email) LIKE LOWER(CONCAT('%', :search, '%'))
//          )
//    """)
//    Page<ChatRoom> findSupportChatsWithSellerOrBidder(
//            @Param("search") String search,
//            Pageable pageable
//    );

    @Query(
        value = """
        SELECT cr.id AS chatId, u.id AS userId, u.username, u.email, u.first_name, u.last_name, ur.role_name AS role
        FROM chat_rooms cr
        JOIN chat_room_participants crp ON cr.id = crp.chat_room_id
        JOIN users u ON crp.user_id = u.id
        JOIN user_roles ur ON u.role_id = ur.id
        WHERE cr.chat_room_type = 'SUPPORT'
        AND (ur.role_name = 'SELLER' OR ur.role_name = 'BIDDER')
        AND (
            LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.first_name) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(u.last_name) LIKE LOWER(CONCAT('%', :search, '%'))
        )
        ORDER BY cr.id DESC
        LIMIT :limit OFFSET :offset
        """,
        nativeQuery = true
    )
    List<Object[]> findSupportChatsNative(
            @Param("search") String search,
            @Param("limit") int limit,
            @Param("offset") int offset
    );




}
