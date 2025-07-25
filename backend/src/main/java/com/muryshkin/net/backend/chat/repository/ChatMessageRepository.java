package com.muryshkin.net.backend.chat.repository;

import com.muryshkin.net.backend.chat.entity.ChatMessage;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;

public interface ChatMessageRepository extends ReactiveCrudRepository<ChatMessage, Long> {
    Flux<ChatMessage> findBySessionIdOrderByIdAsc(String sessionId);
}
