package com.helios.auctix.services;

import com.helios.auctix.domain.sse.SSEEventTypeEnum;
import com.helios.auctix.domain.user.User;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SSEService {

    private final Map<String, SseEmitter> clients = new ConcurrentHashMap<>();

    public SseEmitter registerClient(User user) {
        String username = user.getUsername();
        SseEmitter emitter = new SseEmitter(Long.MAX_VALUE);
        clients.put(username, emitter);
        emitter.onCompletion(() -> clients.remove(username));
        emitter.onTimeout(() -> clients.remove(username));
        emitter.onError((e) -> clients.remove(username));
        return emitter;
    }

    public void broadcast(String message) {
        clients.forEach((username, emitter) -> sendToUser(username, SSEEventTypeEnum.SYSTEM_EVENT , message));
    }

    public void sendToUser(String username,SSEEventTypeEnum eventType, String message) {
        if(eventType==null){
            throw new IllegalArgumentException("eventType could not be null");
        }
        SseEmitter emitter = clients.get(username);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name(eventType.name()).data(message));
            } catch (IOException e) {
                clients.remove(username);
            }
        }
    }

    public boolean isUserConnected(String username) {
        return clients.containsKey(username);
    }
}

