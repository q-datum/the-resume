package com.muryshkin.net.backend.chat.service;

import com.muryshkin.net.backend.chat.dto.ChatResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

@Service
public class ChatService {

    @Value("${openai.api.key}")
    private String openAiApiKey;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://api.openai.com/v1")
            .build();

    public ChatResponse getChatResponse(String message) {
        // Non-streaming fallback
        String body = """
        {
          "model": "gpt-4o-mini",
          "messages": [
            {"role": "system", "content": "You are an interactive resume bot for Alexander Muryshkin."},
            {"role": "user", "content": "%s"}
          ]
        }
        """.formatted(message);

        String response = webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + openAiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return new ChatResponse(response);
    }

    public Flux<String> streamChatResponse(String message) {
        String body = """
        {
          "model": "gpt-4o-mini",
          "stream": true,
          "messages": [
            {"role": "system", "content": "You are an interactive resume bot for Alexander Muryshkin."},
            {"role": "user", "content": "%s"}
          ]
        }
        """.formatted(message);

        return webClient.post()
                .uri("/chat/completions")
                .header("Authorization", "Bearer " + openAiApiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(body)
                .retrieve()
                .bodyToFlux(String.class);
    }
}
