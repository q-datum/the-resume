package com.muryshkin.net.backend.chat.controller;

import com.muryshkin.net.backend.chat.entity.ChatMessage;
import com.muryshkin.net.backend.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;

/**
 * REST controller responsible for handling chat-related requests.
 * </br>
 * This controller exposes endpoints for:
 * - Streaming chat responses from the ChatGPT API.
 * - Retrieving chat history for a given user session.
 * </br>
 * The controller delegates all business logic to the ChatService.
 */
@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    /**
     * <h3>Streams chat responses from the backend to the client in real-time.</h3>
     * <p>
     * This endpoint connects to the OpenAI API in streaming mode, returning
     * server-sent events (SSE) as tokens are generated.
     * </p>
     * @param sessionId unique identifier of the user session.
     *                  This is used to store and retrieve conversation context.
     * @param message   the user's message or query.
     * @return a Flux emitting tokens of the assistant's response as they arrive.
     * <p></p>
     * Example: GET /api/chat/stream?sessionId=abc123&message=Hello
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<String> streamChat(
            @RequestParam String sessionId,
            @RequestParam String message) {
        return chatService.streamChatResponse(sessionId, message);
    }

    /**
     * Retrieves the chat history for a given session.
     * <p></p>
     * This endpoint returns all messages exchanged in the specified session,
     * ordered by their creation time.
     * <p></p>
     * @param sessionId unique identifier of the user session.
     * @return a Flux emitting ChatMessage objects representing the conversation history.
     * <p></p>
     * Example: GET /api/chat/history?sessionId=abc123
     */
    @GetMapping("/history")
    public Flux<ChatMessage> getHistory(@RequestParam String sessionId) {
        return chatService.getChatHistory(sessionId);
    }
}
