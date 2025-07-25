package com.muryshkin.net.backend.chat.repository;

import com.muryshkin.net.backend.chat.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatSessionRepository extends JpaRepository<ChatSession, String> {}
