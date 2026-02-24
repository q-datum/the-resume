package com.muryshkin.net.backend.contact.service;

import com.muryshkin.net.backend.contact.dto.ContactRequestDto;

public interface ContactNotificationService {
    void sendContactNotification(ContactRequestDto request);
}