package com.helios.auctix.controllers;

import com.helios.auctix.domain.sse.SSEEventTypeEnum;
import com.helios.auctix.domain.sse.SSEEventValueEnum;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.services.SSEService;
import com.helios.auctix.services.user.UserDetailsService;
import lombok.AllArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.apache.tomcat.websocket.AuthenticationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;


@Log4j2
@RestController
@RequestMapping("/api/sse")
@AllArgsConstructor
public class SSEController {

    @Autowired
    private final SSEService sseService;
    @Autowired
    private UserDetailsService userDetailsService;

    @GetMapping(value = "/register", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter connect() throws AuthenticationException, IOException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);
        return sseService.registerClient(currentUser);
    }

    @Profile("dev")
    @GetMapping("/hello")
    public String sayHello() {
         sseService.broadcast( SSEEventValueEnum.CONNECTED );
        return "Hello sent to all SSE clients!";
    }

    @Profile("dev")
    @PostMapping(value = "/sendToUser" )
    public String sendToUser(@RequestParam String username, @RequestParam String eventType ,@RequestParam String message) {
        SSEEventTypeEnum enumEventType = SSEEventTypeEnum.valueOf(eventType);
        SSEEventValueEnum value = SSEEventValueEnum.valueOf(message);
        sseService.sendToUser(username, enumEventType , value );
        return "Message sent to " + username;
    }

}
