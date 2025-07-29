package com.helios.auctix.services;

import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.chat.ChatMessage;
import com.helios.auctix.domain.chat.ChatRoom;
import com.helios.auctix.domain.chat.ChatRoomType;
import com.helios.auctix.domain.user.Bidder;
import com.helios.auctix.domain.user.Seller;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.repositories.AuctionRepository;
import com.helios.auctix.repositories.chat.ChatMessageRepository;
import com.helios.auctix.repositories.chat.ChatRoomRepository;
import jakarta.transaction.Transactional;
import lombok.extern.java.Log;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Log
@Service
public class ChatService {
    private final ChatMessageRepository chatMessageRepository;

    private final ChatRoomRepository chatRoomRepository;
    private final AuctionRepository auctionRepository;


    public ChatService(ChatMessageRepository chatMessageRepository, ChatRoomRepository chatRoomRepository, AuctionRepository auctionRepository) {
        this.chatMessageRepository = chatMessageRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.auctionRepository = auctionRepository;
    }

    public ChatMessage saveChatMessage(ChatMessage chatMessage) {
        return chatMessageRepository.save(chatMessage);
    }

    @Transactional
    public boolean joinChatRoom(User user, UUID auctionId) {
        Optional<ChatRoom> chatRoomOpt = chatRoomRepository.findChatRoomByAuctionId(auctionId);
        ChatRoom chatRoom;

        if (chatRoomOpt.isEmpty()) {
            log.warning("There isn't a chat room for the given auction, creating one");
            chatRoom = createChatRoomForAuction(auctionId);
        } else {
            chatRoom = chatRoomOpt.get();
        }
        // Directly insert the user into the chat room participants table. No need to check if user is present in the table
        // "ON CONFLICT DO NOTHING" in the query means if the user is already in the chat room, the insert is ignored.
        chatRoomRepository.addUserToChatRoom(chatRoom.getId(), user.getId());

        log.info("User " + user.getId() + " entered the chat room " + chatRoom.getId());

        return true;
    }

    @Transactional
    public boolean joinChatRoom(User user, UUID chatRoomId, ChatRoomType chatRoomType) {
        if (chatRoomType == ChatRoomType.AUCTION) {
            throw new IllegalArgumentException("Use joinChatRoom(User, UUID auctionId) for auction chat rooms.");
        }

        Optional<ChatRoom> chatRoomOpt = chatRoomRepository.findById(chatRoomId);
        ChatRoom chatRoom;

        if (chatRoomOpt.isEmpty()) {
            log.warning("There isn't a chat room for the given ID, creating one");

            chatRoom = ChatRoom.builder()
                    .type(chatRoomType)
                    .build();

            chatRoom = chatRoomRepository.save(chatRoom);
        } else {
            chatRoom = chatRoomOpt.get();
        }

        chatRoomRepository.addUserToChatRoom(chatRoom.getId(), user.getId());

        log.info("User " + user.getId() + " entered the chat room " + chatRoom.getId());

        return true;
    }

    public ChatRoom getChatRoomByAuctionId(String auctionId) {
        try {
            log.warning("No chat room for auction ID " + auctionId);
            return chatRoomRepository.findChatRoomByAuctionId(UUID.fromString(auctionId))
                    .orElse(null);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid auction ID format: " + auctionId);
        }
    }


//    public List<ChatMessage> getChatMessages(String chatRoomId, int page, int size) {
//        Pageable pageable = PageRequest.of(page, size);
//        return chatMessageRepository.findByChatRoomIdOrderByTimestampAsc(chatRoomId, pageable);
//    }

    public List<ChatMessage> getMessagesBeforeTimestamp(ChatRoom chatRoom, LocalDateTime beforeTimestamp, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("timestamp")));

        if (chatRoom == null) {
            throw new IllegalArgumentException("Chat Room is empty");
        }

        UUID chatRoomId = chatRoom.getId();
        return chatMessageRepository.findByChatRoomIdAndTimestampBeforeOrderByTimestampDesc(chatRoomId, beforeTimestamp, pageable);
    }

    @Transactional
    public ChatRoom createChatRoomForAuction(UUID auctionId) {
        Auction auction = auctionRepository.findById(auctionId)
                .orElseThrow(() -> new IllegalArgumentException("Auction not found for ID: " + auctionId));

        Optional<ChatRoom> existingChatRoom = chatRoomRepository.findChatRoomByAuctionId(auctionId);
        if (existingChatRoom.isPresent()) {
            return existingChatRoom.get();
        }

        ChatRoom chatRoom = ChatRoom.builder()
                .type(ChatRoomType.AUCTION)
                .auction(auction)
                .build();

        ChatRoom savedChatRoom = chatRoomRepository.save(chatRoom);

        // Add seller as participant
        if (auction.getSeller() != null) {
            chatRoomRepository.addUserToChatRoom(savedChatRoom.getId(), auction.getSeller().getId());
        }

        return savedChatRoom;
    }


    public ChatRoom getOrCreateSupportChatForUser(User user) {
        if (user.getRoleEnum() != UserRoleEnum.SELLER && user.getRoleEnum() != UserRoleEnum.BIDDER) {
            throw new IllegalStateException("Only sellers and bidders have support chats.");
        }

        Optional<ChatRoom> existingChat = chatRoomRepository.findSupportChatByUserId(user.getId());
        if (existingChat.isPresent()) {
            return existingChat.get();
        }

        ChatRoom newChat = new ChatRoom();
        newChat.setType(ChatRoomType.SUPPORT);
        chatRoomRepository.save(newChat);

        joinChatRoom(user, newChat.getId(), ChatRoomType.SUPPORT);
        return chatRoomRepository.save(newChat);
    }
    public ChatRoom getOrCreateWinnerSellerChat(User winner, User seller, Auction auction) {

        if (!(seller.getRoleEnum().equals(UserRoleEnum.SELLER)
                && winner.getRoleEnum().equals(UserRoleEnum.BIDDER))) {
            throw new IllegalArgumentException("Invalid roles for winner-seller chat.");
        }

        Optional<ChatRoom> existingChat = chatRoomRepository
                .findPrivateChatBetweenForAuction(seller.getId(), winner.getId(), auction.getId());

        if (existingChat.isPresent()) {
            return existingChat.get();
        }

        ChatRoom newChat = new ChatRoom();
        newChat.setType(ChatRoomType.PRIVATE);
        newChat.setAuction(auction);

        chatRoomRepository.save(newChat);

        joinChatRoom(seller, newChat.getId(), ChatRoomType.PRIVATE);
        joinChatRoom(winner, newChat.getId(), ChatRoomType.PRIVATE);

        return chatRoomRepository.save(newChat);
    }





}
