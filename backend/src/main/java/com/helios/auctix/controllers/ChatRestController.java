package com.helios.auctix.controllers;


import com.helios.auctix.domain.chat.ChatMessage;
import com.helios.auctix.domain.chat.ChatRoom;
import com.helios.auctix.domain.chat.ChatRoomType;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.dtos.ChatMessageDTO;
import com.helios.auctix.dtos.ChatRoomSearchResultDTO;
import com.helios.auctix.dtos.SupportChatDTO;
import com.helios.auctix.mappers.Mapper;
import com.helios.auctix.repositories.chat.ChatRoomRepository;
import com.helios.auctix.services.ChatService;
import com.helios.auctix.services.user.UserDetailsService;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.websocket.AuthenticationException;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RequestMapping("/api/chat")  // Getting chat messages should be allowed for non-logged-in users as well
@RestController
public class ChatRestController  {

    private final ChatService chatService;
    private final UserDetailsService userDetailsService;
    private final Mapper<ChatMessage, ChatMessageDTO> chatMessageDTOMapper;
    private final ChatRoomRepository chatRoomRepository;

    public ChatRestController(
            ChatService chatService,
            UserDetailsService userDetailsService,
            Mapper<ChatMessage, ChatMessageDTO> chatMessageDTOMapper,
            ChatRoomRepository chatRoomRepository
    ) {
        this.chatService = chatService;
        this.userDetailsService = userDetailsService;
        this.chatMessageDTOMapper = chatMessageDTOMapper;
        this.chatRoomRepository = chatRoomRepository;
    }

    @GetMapping("/{chatType}/{id}/messages")
    public ResponseEntity<List<ChatMessageDTO>> getChatMessages(
            @PathVariable String chatType,
            @PathVariable String id,
            @RequestParam int page,
            @RequestParam int size,
            @RequestParam(required = false) LocalDateTime beforeTimestamp
    ) {
        if (beforeTimestamp == null) {
            beforeTimestamp = LocalDateTime.now();
        }

        ChatRoom chatRoom;
        if (chatType.equalsIgnoreCase("auction")) {
            chatRoom = chatRoomRepository.findChatRoomByAuctionId(UUID.fromString(id)).orElse(null);
        } else {
            chatRoom = chatRoomRepository.findById(UUID.fromString(id)).orElse(null);
        }

        if (chatRoom == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        boolean isUserInChatRoom = false;

        // Require auth for all except auction
        if (!chatRoom.getType().equals(ChatRoomType.AUCTION)) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser;
            try {
                currentUser = userDetailsService.getAuthenticatedUser(authentication);

                isUserInChatRoom = chatRoomRepository.isUserMemberOfChatRoom(chatRoom.getId(), currentUser.getId());


            } catch (AuthenticationException e) {
                log.error("Failed to get the authorized user in fetching chat messages");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();

            }

            if (!isUserInChatRoom &&
                    !(currentUser.getRoleEnum() == UserRoleEnum.ADMIN || currentUser.getRoleEnum() == UserRoleEnum.SUPER_ADMIN)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
        }

        List<ChatMessage> messages = chatService.getMessagesBeforeTimestamp(
                chatRoom, beforeTimestamp, page, size);

        List<ChatMessageDTO> response = messages.stream()
                .map(chatMessageDTOMapper::mapTo)
                .toList();

        return ResponseEntity.ok(response);
    }


    @GetMapping("/support")
    public ResponseEntity<Map<String, UUID>> getOrCreateSupportChat() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = null;
        try {
            user = userDetailsService.getAuthenticatedUser(authentication);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        ChatRoom supportChat = chatService.getOrCreateSupportChatForUser(user);
        return ResponseEntity.ok(Map.of("id", supportChat.getId()));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ChatRoomSearchResultDTO>> searchUserChats(
            @RequestParam(required = false) String searchTerm,
            @RequestParam(defaultValue = "all") String chatRoomType,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = null;
        try {
            user = userDetailsService.getAuthenticatedUser(authentication);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<ChatRoomSearchResultDTO> results = chatService.searchChats(user.getId(), searchTerm, chatRoomType, limit, offset);
        return ResponseEntity.ok(results);
    }


    @GetMapping("/support/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Page<SupportChatDTO>> getSupportChats(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {

        List<Object[]> rows = chatRoomRepository.findSupportChatsNative(search, size, page * size);

        List<SupportChatDTO> dtos = rows.stream().map(row -> new SupportChatDTO(
                UUID.fromString(row[0].toString()), // chatId
                UUID.fromString(row[1].toString()), // userId
                row[2].toString(), // username
                row[3].toString(), // email
                row[4].toString() + " " + row[5].toString(), // fullName
                row[6].toString() // role
        )).toList();

        return ResponseEntity.ok(new PageImpl<>(dtos, PageRequest.of(page, size), dtos.size()));


    }

    @PutMapping("/{chatType}/{id}/last-read")
    public ResponseEntity<Void> updateLastReadTimestamp(
            @PathVariable String chatType,
            @PathVariable String id) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = null;
        try {
            user = userDetailsService.getAuthenticatedUser(authentication);
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ChatRoom chatRoom;
        if (chatType.equalsIgnoreCase("auction")) {
            chatRoom = chatRoomRepository.findChatRoomByAuctionId(UUID.fromString(id)).orElse(null);
        } else {
            chatRoom = chatRoomRepository.findById(UUID.fromString(id)).orElse(null);
        }

        if (chatRoom == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        chatService.markAsRead(chatRoom.getId() ,user.getId());

        return ResponseEntity.noContent().build();
    }





}
