package com.muryshkin.net.backend.chat.controller;

import com.muryshkin.net.backend.chat.entity.ChatMessage;
import com.muryshkin.net.backend.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

import java.util.List;

/**
 * REST controller responsible for handling chat-related requests.
 *
 * This controller exposes endpoints for:
 * - Streaming chat responses from the ChatGPT API.
 * - Retrieving chat history for a given user session.
 *
 * The controller delegates all business logic to the ChatService.
 */
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * Streams chat responses from the backend to the client in real-time.
     *
     * This endpoint connects to the OpenAI API in streaming mode, returning
     * server-sent events (SSE) as tokens are generated.
     *
     * @param sessionId unique identifier of the user session.
     *                  This is used to store and retrieve conversation context.
     * @param message   the user's message or query.
     * @return a Flux emitting tokens of the assistant's response as they arrive.
     *
     * Example: GET /api/chat/stream?sessionId=abc123&message=Hello
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(
            @RequestParam String sessionId,
            @RequestParam String message) {
        return chatService.streamChatResponse(sessionId, message);
    }

    /**
     * Retrieves the entire chat history for a given session.
     *
     * This can be used by the client to reload previous conversations
     * after a page refresh or to resume a session.
     *
     * @param sessionId unique identifier of the user session.
     * @return a list of ChatMessage objects in chronological order.
     *
     * Example: GET /api/chat/history?sessionId=abc123
     */
    @GetMapping("/history")
    public List<ChatMessage> getHistory(@RequestParam String sessionId) {
        return chatService.getChatHistory(sessionId);
    }
}
