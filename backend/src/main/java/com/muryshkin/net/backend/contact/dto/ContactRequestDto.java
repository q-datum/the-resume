package com.muryshkin.net.backend.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ContactRequestDto {

    @NotBlank(message = "Name cannot be blank.")
    @Size(max = 100, message = "Name is too long.")
    private String name;

    @Email(message = "Email format is invalid.")
    @Size(max = 255, message = "Email is too long.")
    private String email; // optional

    @NotBlank(message = "Message cannot be blank.")
    @Size(max = 5000, message = "Message is too long.")
    private String message;

    @NotBlank(message = "Recaptcha Token cannot be blank.")
    @Size(max=5000, message = "Wrong Recaptcha Token format")
    private String recaptchaToken;
}