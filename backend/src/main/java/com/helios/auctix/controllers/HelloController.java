package com.helios.auctix.controllers;

import com.helios.auctix.domain.chat.ChatMessage;
import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.dtos.ChatMessageDTO;
import com.helios.auctix.events.notification.NotificationEventPublisher;
import com.helios.auctix.mappers.Mapper;
import com.helios.auctix.repositories.UserRepository;
import com.helios.auctix.services.ChatService;
import com.helios.auctix.services.CustomUserDetailsService;
import com.helios.auctix.services.FirebaseCloudMessageService;
import com.helios.auctix.services.JwtService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;

@RequestMapping("/api/public")
@RestController
public class HelloController {

    private JwtService jwtService;
    private UserRepository userRepository;
    private CustomUserDetailsService customUserDetailsService;
    private ChatService chatService;
    private Mapper<ChatMessage, ChatMessageDTO> chatMessageDTOMapper;
    private final FirebaseCloudMessageService firebaseCloudMessageService;
    private final NotificationEventPublisher notificationEventPublisher;


    public HelloController(
            JwtService jwtService,
            UserRepository userRepository,
            CustomUserDetailsService customUserDetailsService,
            ChatService chatService,
            Mapper<ChatMessage, ChatMessageDTO> chatMessageDTOMapper,
            FirebaseCloudMessageService firebaseCloudMessageService,
            NotificationEventPublisher notificationEventPublisher
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.customUserDetailsService = customUserDetailsService;
        this.chatService = chatService;
        this.chatMessageDTOMapper = chatMessageDTOMapper;
        this.firebaseCloudMessageService = firebaseCloudMessageService;
        this.notificationEventPublisher = notificationEventPublisher;
    }

    @GetMapping("/hello")
    public String sayHello() {
        return "Hello World";
    }

    @GetMapping("/hello2")
    public String helloPrincipal(Principal principal) {
        return "Hello, " + principal.getName();
    }

    @GetMapping("/getjwt/{email}")
    public String getJwt(@PathVariable String email) {
        return jwtService.generateToken(email, UserRoleEnum.BIDDER);
    }

    @GetMapping("/jwt/verify/{token}")
    public Boolean verifyJwt(@PathVariable String token) {
        try {
            jwtService.isValidToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @GetMapping("/jwt/role/{email}/{token}")
    public String getRole(@PathVariable String email, @PathVariable String token) {

//        return "hi" + email + " " + token;
        User user = userRepository.findByEmail(email);

        UserDetails userDetails = customUserDetailsService.loadUserByUsername(user.getEmail());

        boolean isValid = jwtService.isValidToken(token, userDetails);

        System.out.println("User : " + user + "userDetails" + userDetails + " isValid : " + isValid);

        if (isValid) {
            return jwtService.extractRole(token).name();
        } else {
            return null;
        }
    }

//    @GetMapping("/{chatRoomId}/messages")
//    public ResponseEntity<List<ChatMessageDTO>> getChatMessages(
//            @PathVariable String chatRoomId,
//            @RequestParam int page,
//            @RequestParam int size,
//            @RequestParam LocalDateTime beforeTimestamp) {
//
//        List<ChatMessage> messages = chatService.getMessagesBeforeTimestamp(
//                chatRoomId, beforeTimestamp, page, size);
//
//        List<ChatMessageDTO> response = messages.stream()
//                .map(chatMessageDTOMapper::mapTo)
//                .toList();
//
//        return ResponseEntity.ok(response);
//    }



    @GetMapping("/fcm")
    public String sendFCMTest(
            @Valid @RequestParam(required = false) String email,
            @RequestParam(required = false) String message) {


      if (message == null) {
          message = "hello from springboot";
      }

      User user = userRepository.findByEmail(email);

      notificationEventPublisher.publishNotificationEvent(
				"Hi from AuctiX",
                message,
				NotificationCategory.DEFAULT,
				user,
              "/explore-auctions/"
      );


        return "i think we sent it?";

    }

    @GetMapping("/send-notification")
    public String sendNotifTest(
            @Valid @RequestParam(required = true) String email,
            @Valid @RequestParam(required = false) String category,
            @RequestParam(required = false) String message,
            @RequestParam(required = false) String title
            ) {

//        return " e " + email + " " + category + " msg " + message;

        if (message == null) {
            message = "hello from springboot";
        }


        if (title == null ) {
            title = "Hi from Auctix";
        }

        User user = userRepository.findByEmail(email);

        if (category == null) {
            category = "DEFAULT";
        }
        NotificationCategory notificationCategory = NotificationCategory.valueOf(category);

        notificationEventPublisher.publishNotificationEvent(
                title,
                message,
                notificationCategory,
                user,
                "/explore-auctions/"
        );

        return "sent";
    }
}