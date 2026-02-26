package com.muryshkin.net.backend.contact.service.impl;

import com.muryshkin.net.backend.contact.dto.ContactRequestDto;
import com.muryshkin.net.backend.contact.service.ContactNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class TelegramContactNotificationService implements ContactNotificationService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${telegram.bot.token}")
    private String botToken;

    @Value("${telegram.chat.id}")
    private String chatId;

    @Override
    public void sendContactNotification(ContactRequestDto request) {
        String url = "https://api.telegram.org/bot" + botToken + "/sendMessage";

        String emailPart = (request.getEmail() == null || request.getEmail().isBlank())
                ? "not provided"
                : request.getEmail().trim();

        String text = """
                📩 New contact form message
                
                Name: %s
                Email: %s
                
                Message:
                %s
                """.formatted(
                safe(request.getName()),
                safe(emailPart),
                safe(request.getMessage())
        );

        Map<String, Object> body = new HashMap<>();
        body.put("chat_id", chatId);
        body.put("text", text);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        } catch (Exception ex) {
            log.error("Failed to send Telegram notification.", ex);
            throw new RuntimeException("Failed to send contact notification.");
        }
    }

    private String safe(String value) {
        return value == null ? "" : value.strip();
    }
}