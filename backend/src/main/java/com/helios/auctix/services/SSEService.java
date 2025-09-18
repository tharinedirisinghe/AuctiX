package com.helios.auctix.services;

import com.helios.auctix.domain.sse.SSEEventTypeEnum;
import com.helios.auctix.domain.sse.SSEEventValueEnum;
import com.helios.auctix.domain.user.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class SSEService {

    private final Map<String, SseEmitter> clients = new ConcurrentHashMap<>();

    public SseEmitter registerClient(User user) throws IOException {
        log.info("[SSE]: connections " + clients.size());
        String username = user.getUsername();
        SseEmitter emitter = new SseEmitter(1800000L);
        clients.put(username, emitter);
        emitter.onCompletion(() -> clients.remove(username));
        emitter.onTimeout(() -> {
            clients.remove(username);
            log.info("[SSE] connection timed out for user: " + username);
        });
        emitter.onError((e) -> {
            clients.remove(username);
            log.info("[SSE] connection timed out for user: " + username);
        });
        emitter.send(SseEmitter.event().name(SSEEventTypeEnum.SYSTEM_EVENT.name()).data(SSEEventValueEnum.CONNECTED));
        return emitter;
    }

    public void broadcast(SSEEventValueEnum eventValue) {
        clients.forEach((username, emitter) -> sendToUser(username, SSEEventTypeEnum.SYSTEM_EVENT , eventValue));
    }

    public void sendToUser(String username,SSEEventTypeEnum eventType, SSEEventValueEnum value) {
        if(eventType==null){
            throw new IllegalArgumentException("eventType could not be null");
        }
        SseEmitter emitter = clients.get(username);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name(eventType.name()).data(value.name()));
            } catch (Exception e) {
                clients.remove(username);
            }
        }
    }

    public boolean isUserConnected(String username) {
        return clients.containsKey(username);
    }
}

