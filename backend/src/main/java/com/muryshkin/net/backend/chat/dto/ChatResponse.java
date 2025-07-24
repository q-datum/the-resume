package com.muryshkin.net.backend.chat.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents the response from the chat endpoint containing the bot reply.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String reply;
}
