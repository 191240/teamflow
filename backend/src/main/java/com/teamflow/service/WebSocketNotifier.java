package com.teamflow.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class WebSocketNotifier {
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketNotifier(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void projectChanged(Long projectId, String reason) {
        messagingTemplate.convertAndSend("/topic/project/" + projectId,
                Map.of("type", "refresh", "projectId", projectId, "reason", reason));
    }
}
