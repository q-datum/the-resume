package com.muryshkin.net.backend.chat.controller;

import com.muryshkin.net.backend.chat.dto.ChatRequest;
import com.muryshkin.net.backend.chat.dto.ChatResponse;
import com.muryshkin.net.backend.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ChatResponse chat(@RequestBody ChatRequest request) {
        return chatService.getChatResponse(request.getMessage());
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(@RequestParam String message) {
        return chatService.streamChatResponse(message);
    }
}
