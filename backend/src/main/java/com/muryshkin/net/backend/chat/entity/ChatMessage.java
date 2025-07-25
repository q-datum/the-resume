package com.muryshkin.net.backend.chat.entity;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

@Table("chat_message")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    private Long id;

    @Column("role")
    private String role;

    @Column("content")
    private String content;

    @Column("session_id")
    private String sessionId;
}
