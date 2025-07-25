package com.muryshkin.net.backend.chat.repository;

import com.muryshkin.net.backend.chat.entity.ChatSession;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;

public interface ChatSessionRepository extends ReactiveCrudRepository<ChatSession, String> {
}
