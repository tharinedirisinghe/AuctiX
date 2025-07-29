package com.helios.auctix.controllers;

import com.helios.auctix.domain.chat.ChatMessage;
import com.helios.auctix.domain.chat.ChatRoom;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.dtos.ChatMessageDTO;
import com.helios.auctix.mappers.Mapper;
import com.helios.auctix.repositories.AuctionRepository;
import com.helios.auctix.repositories.chat.ChatRoomRepository;
import com.helios.auctix.services.ChatService;
import com.helios.auctix.services.user.UserRegisterService;
import lombok.extern.java.Log;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.stereotype.Controller;

import java.util.UUID;

import static java.lang.Thread.sleep;

/**
 * This is the Controller for the websocket side of Chat, not for the API
 * <p/>
 * For the Checkout ChatRestController for API Controller of Chat
 */
@Log
@Controller
public class ChatController {

    private final ChatService chatService;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRegisterService userRegisterService;
    private final AuctionRepository auctionRepository;
    private final Mapper<ChatMessage, ChatMessageDTO> chatMessageDTOMapper;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(
            SimpMessagingTemplate messagingTemplate,
            ChatService chatService, ChatRoomRepository chatRoomRepository,
            Mapper<ChatMessage, ChatMessageDTO> chatMessageDTOMapper,
            UserRegisterService userRegisterService,
            AuctionRepository auctionRepository
    ) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
        this.chatRoomRepository = chatRoomRepository;
        this.chatMessageDTOMapper = chatMessageDTOMapper;
        this.userRegisterService = userRegisterService;
        this.auctionRepository = auctionRepository;
    }

    @MessageMapping("/chat.sendMessage/{chatType}/{id}")
    public void sendMessage(
            @DestinationVariable String chatType,
            @DestinationVariable String id,
            ChatMessageDTO chatMessageDto,
            SimpMessageHeaderAccessor headerAccessor
    ) throws InterruptedException {

        if (headerAccessor.getUser() == null || headerAccessor.getUser() instanceof AnonymousAuthenticationToken) {
            log.severe("Guest users cannot send messages");
            throw new IllegalArgumentException("You must be logged in to send messages");
        }

        String userEmail = headerAccessor.getUser().getName();
        log.info("Processing message from user: " + userEmail + " for chatType: " + chatType + " and id: " + id);

        User sender = userRegisterService.getUserFromEmail(userEmail);
        if (sender == null) {
            throw new IllegalArgumentException("Authenticated user not found.");
        }

        ChatRoom chatRoom;

        switch (chatType.toUpperCase()) {
            case "AUCTION":
                // id is auctionId here
                chatRoom = chatService.getChatRoomByAuctionId(id);
                if (chatRoom == null) {
                    log.warning("ChatRoom not found for the auction id " + id);
                    return;
                }
                // Check seller owns auction
                if (sender.getRoleEnum() == UserRoleEnum.SELLER) {
                    UUID sellerId = sender.getSeller().getId();
                    boolean isAuctionByMessagingSeller = auctionRepository.isSellerOwnerOfAuction(UUID.fromString(id), sellerId);
                    if (!isAuctionByMessagingSeller) {
                        log.warning("Seller does not own this auction, message rejected");
                        return;
                    }
                }
                break;

            case "SUPPORT":
            case "DIRECT":
            case "GROUP":
                // id is chatRoomId here
                chatRoom = chatRoomRepository.findById(UUID.fromString(id)).orElse(null);
                if (chatRoom == null) {
                    log.warning("ChatRoom not found for id " + id);
                    return;
                }
                 if (!chatRoomRepository.isUserMemberOfChatRoom(chatRoom.getId(), sender.getId())) {
                     log.warning("User not authorized in this chat room");
                     return;
                 }
                break;

            default:
                log.warning("Unknown chat type: " + chatType);
                return;
        }

        ChatMessage chatMessage = chatMessageDTOMapper.mapFrom(chatMessageDto);
        chatMessage.setSender(sender);
        chatMessage.setChatRoom(chatRoom);
        ChatMessage savedChatMessage = chatService.saveChatMessage(chatMessage);

        chatService.incrementUnreadCountForOthers(chatRoom.getId(), sender.getId());

        ChatMessageDTO responseDto = chatMessageDTOMapper.mapTo(savedChatMessage);
        String topicDestination = String.format("/topic/chat/%s/%s", chatType.toLowerCase(), id);
        messagingTemplate.convertAndSend(topicDestination, responseDto);

        log.info("Sent message to topic: " + topicDestination);
    }
}