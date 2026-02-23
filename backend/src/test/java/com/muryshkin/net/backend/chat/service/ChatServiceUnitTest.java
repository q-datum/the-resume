package com.muryshkin.net.backend.chat.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.muryshkin.net.backend.chat.entity.ChatMessage;
import com.muryshkin.net.backend.chat.exception.OpenAiServiceException;
import com.muryshkin.net.backend.chat.repository.ChatMessageRepository;
import com.muryshkin.net.backend.exception.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.context.TestPropertySource;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.lang.reflect.Field;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ChatService.
 */
@TestPropertySource(locations = "classpath:application-test.properties")
public class ChatServiceUnitTest {

    // ============================== Setup Utilities ==============================

    static void setMasterPrompt(ChatService service, String prompt) {
        try {
            Field field = ChatService.class.getDeclaredField("masterPrompt");
            field.setAccessible(true);
            field.set(service, prompt);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    static void setObjectMapper(ChatService service, ObjectMapper mapper) {
        try {
            Field field = ChatService.class.getDeclaredField("objectMapper");
            field.setAccessible(true);
            field.set(service, mapper);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ============================== Build Request Body Tests ==============================

    @Nested
    class BuildRequestBodyTest {

        private ChatService chatService;

        @BeforeEach
        void setUp() {
            chatService = new ChatService(null);
            setMasterPrompt(chatService, "This is the master prompt.");
        }

        @Test
        void shouldIncludeMasterPromptAndHistory() {
            List<ChatMessage> history = List.of(
                    ChatMessage.builder().role("user").content("Hello").build(),
                    ChatMessage.builder().role("assistant").content("Hi there!").build()
            );

            String json = chatService.buildRequestBody(history);

            assertThat(json).contains("This is the master prompt.");
            assertThat(json).contains("user", "Hello", "assistant", "Hi there!");
            assertThat(json).contains("\"model\":\"gpt-4o-mini\"");
            assertThat(json).contains("\"stream\":true");
        }

        @Test
        void shouldEscapeSpecialCharacters() {
            List<ChatMessage> history = List.of(
                    ChatMessage.builder().role("user").content("A \"quote\" and newline\nhere").build()
            );

            String json = chatService.buildRequestBody(history);

            assertThat(json).contains("\\\"quote\\\"");
            assertThat(json).contains("\\n");
        }

        @Test
        void shouldThrowOnSerializationFailure() {
            ChatService failingService = new ChatService(null);
            setMasterPrompt(failingService, "prompt");

            ObjectMapper brokenMapper = new ObjectMapper() {
                @Override
                public String writeValueAsString(Object value) throws JsonProcessingException {
                    throw new JsonProcessingException("Simulated failure") {};
                }
            };
            setObjectMapper(failingService, brokenMapper);

            List<ChatMessage> history = List.of(
                    ChatMessage.builder().role("user").content("test").build()
            );

            assertThatThrownBy(() -> failingService.buildRequestBody(history))
                    .isInstanceOf(OpenAiServiceException.class)
                    .hasMessageContaining("Failed to serialize messages");
        }
    }

    // ============================== Stream Chat Response Tests ==============================

    @Nested
    class StreamChatResponseTest {

        private ChatMessageRepository messageRepository;
        private ChatService chatService;

        @BeforeEach
        void setUp() {
            messageRepository = mock(ChatMessageRepository.class);
            chatService = new ChatService(messageRepository);
            setMasterPrompt(chatService, "You are helpful.");
        }

        @Test
        void shouldThrow_WhenSessionIdIsInvalid() {
            assertThatThrownBy(() -> chatService.streamChatResponse(null, "Hi").subscribe())
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Session ID cannot be null or blank.");

            assertThatThrownBy(() -> chatService.streamChatResponse("   ", "Hi").subscribe())
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Session ID cannot be null or blank.");
        }

        @Test
        void shouldThrow_WhenMessageIsInvalid() {
            assertThatThrownBy(() -> chatService.streamChatResponse("abc", null).subscribe())
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Message cannot be null or blank.");

            assertThatThrownBy(() -> chatService.streamChatResponse("abc", "   ").subscribe())
                    .isInstanceOf(BadRequestException.class)
                    .hasMessageContaining("Message cannot be null or blank.");
        }

        @Test
        void shouldStreamAndSaveAssistantMessage() {
            String sessionId = "test-session";
            String userMessage = "Hello";

            when(messageRepository.save(any()))
                    .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

            when(messageRepository.findBySessionIdOrderByIdAsc(sessionId))
                    .thenReturn(Flux.just(ChatMessage.builder()
                            .role("user")
                            .content(userMessage)
                            .sessionId(sessionId)
                            .build()));

            ChatService spied = spy(chatService);
            doReturn(
                    Flux.just("Hi", "!")
                            .concatWith(chatService.saveAssistantMessageAsync(sessionId, "Hi!").thenMany(Flux.empty()))
            ).when(spied).streamAssistantResponse(any(), any());

            StepVerifier.create(spied.streamChatResponse(sessionId, userMessage))
                    .expectNext("Hi", "!")
                    .verifyComplete();

            ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);
            verify(messageRepository, times(2)).save(captor.capture());

            List<ChatMessage> saved = captor.getAllValues();

            ChatMessage userMsg = saved.stream()
                    .filter(m -> "user".equals(m.getRole()))
                    .findFirst().orElseThrow();

            ChatMessage assistantMsg = saved.stream()
                    .filter(m -> "assistant".equals(m.getRole()))
                    .findFirst().orElseThrow();

            assertThat(userMsg.getContent()).isEqualTo("Hello");
            assertThat(assistantMsg.getContent()).isEqualTo("Hi!");
        }

        @Test
        void shouldPropagateException_WhenStreamingFails() {
            String sessionId = "fail-session";

            ChatMessage user = ChatMessage.builder().role("user").content("msg").sessionId(sessionId).build();
            when(messageRepository.save(any())).thenReturn(Mono.just(user));
            when(messageRepository.findBySessionIdOrderByIdAsc(sessionId)).thenReturn(Flux.just(user));

            ChatService spied = spy(chatService);
            doThrow(new OpenAiServiceException("boom"))
                    .when(spied).streamAssistantResponse(any(), any());

            StepVerifier.create(spied.streamChatResponse(sessionId, "msg"))
                    .expectErrorMatches(t -> t instanceof OpenAiServiceException && t.getMessage().contains("boom"))
                    .verify();
        }

        @Test
        void shouldAccumulateAssistantReplyAcrossMultipleTokens() {
            String sessionId = "stream-session";
            String userMessage = "Tell me a joke.";

            when(messageRepository.save(any()))
                    .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

            when(messageRepository.findBySessionIdOrderByIdAsc(sessionId))
                    .thenReturn(Flux.just(ChatMessage.builder()
                            .role("user")
                            .content(userMessage)
                            .sessionId(sessionId)
                            .build()));

            ChatService spied = spy(chatService);
            // "Why did the chicken..." + "cross the road?"
            doReturn(
                    Flux.just("Why did the chicken ", "cross the road?")
                            .concatWith(chatService.saveAssistantMessageAsync(sessionId, "Why did the chicken cross the road?").thenMany(Flux.empty()))
            ).when(spied).streamAssistantResponse(any(), any());

            StepVerifier.create(spied.streamChatResponse(sessionId, userMessage))
                    .expectNext("Why did the chicken ", "cross the road?")
                    .verifyComplete();
        }

        @Test
        void shouldNotSaveAssistantMessage_WhenEmpty() {
            String sessionId = "empty-response";
            String userMessage = "Say nothing.";

            when(messageRepository.save(any()))
                    .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

            when(messageRepository.findBySessionIdOrderByIdAsc(sessionId))
                    .thenReturn(Flux.just(ChatMessage.builder()
                            .role("user")
                            .content(userMessage)
                            .sessionId(sessionId)
                            .build()));

            ChatService spied = spy(chatService);
            doReturn(Flux.empty()).when(spied).streamAssistantResponse(any(), any());

            StepVerifier.create(spied.streamChatResponse(sessionId, userMessage))
                    .verifyComplete();

            ArgumentCaptor<ChatMessage> captor = ArgumentCaptor.forClass(ChatMessage.class);
            verify(messageRepository, times(1)).save(captor.capture()); // Only user message
            assertThat(captor.getValue().getRole()).isEqualTo("user");
        }

        @Test
        void shouldHandleVeryLongMessage() {
            String sessionId = "long-session";
            String longMessage = "A".repeat(10_000);

            when(messageRepository.save(any()))
                    .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

            when(messageRepository.findBySessionIdOrderByIdAsc(sessionId))
                    .thenReturn(Flux.just(ChatMessage.builder()
                            .role("user")
                            .content(longMessage)
                            .sessionId(sessionId)
                            .build()));

            ChatService spied = spy(chatService);
            doReturn(
                    Flux.just("Processing...")
                            .concatWith(chatService.saveAssistantMessageAsync(sessionId, "Processing...").thenMany(Flux.empty()))
            ).when(spied).streamAssistantResponse(any(), any());

            StepVerifier.create(spied.streamChatResponse(sessionId, longMessage))
                    .expectNext("Processing...")
                    .verifyComplete();
        }

        @Test
        void shouldPropagateError_WhenStreamAssistantResponseFails() {
            String sessionId = "error-session";

            when(messageRepository.save(any()))
                    .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

            when(messageRepository.findBySessionIdOrderByIdAsc(sessionId))
                    .thenReturn(Flux.just(ChatMessage.builder()
                            .role("user")
                            .content("Trigger failure")
                            .sessionId(sessionId)
                            .build()));

            ChatService spied = spy(chatService);
            doThrow(new OpenAiServiceException("Simulated OpenAI error"))
                    .when(spied).streamAssistantResponse(any(), any());

            StepVerifier.create(spied.streamChatResponse(sessionId, "Trigger failure"))
                    .expectErrorMatches(e -> e instanceof OpenAiServiceException &&
                            e.getMessage().contains("Simulated OpenAI error"))
                    .verify();
        }

        @Test
        void shouldHandleSpecialCharactersCorrectly() {
            String sessionId = "emoji-session";
            String message = "Can you say 🐱‍👤?";

            when(messageRepository.save(any()))
                    .thenAnswer(invocation -> Mono.just(invocation.getArgument(0)));

            when(messageRepository.findBySessionIdOrderByIdAsc(sessionId))
                    .thenReturn(Flux.just(ChatMessage.builder()
                            .role("user")
                            .content(message)
                            .sessionId(sessionId)
                            .build()));

            ChatService spied = spy(chatService);
            doReturn(
                    Flux.just("Sure: 🐱‍👤")
                            .concatWith(chatService.saveAssistantMessageAsync(sessionId, "Sure: 🐱‍👤").thenMany(Flux.empty()))
            ).when(spied).streamAssistantResponse(any(), any());

            StepVerifier.create(spied.streamChatResponse(sessionId, message))
                    .expectNext("Sure: 🐱‍👤")
                    .verifyComplete();
        }
    }

    @Nested
    class ExtractTokenTest {

        private ChatService chatService;

        @BeforeEach
        void setUp() {
            chatService = new ChatService(null); // no dependencies needed
        }

        @Test
        void shouldExtractTokenFromValidChunkWithPrefix() {
            String chunk = "data: {\"choices\":[{\"delta\":{\"content\":\"Hello\"}}]}";
            String token = chatService.extractToken(chunk);
            assertThat(token).isEqualTo("Hello");
        }

        @Test
        void shouldExtractTokenFromValidChunkWithoutPrefix() {
            String chunk = "{\"choices\":[{\"delta\":{\"content\":\"Hi there!\"}}]}";
            String token = chatService.extractToken(chunk);
            assertThat(token).isEqualTo("Hi there!");
        }

        @Test
        void shouldReturnEmptyString_WhenDoneChunk() {
            assertThat(chatService.extractToken("data: [DONE]")).isEmpty();
            assertThat(chatService.extractToken("[DONE]")).isEmpty();
        }

        @Test
        void shouldReturnEmptyString_WhenDeltaContentMissing() {
            String chunk = "{\"choices\":[{\"delta\":{}}]}";
            String token = chatService.extractToken(chunk);
            assertThat(token).isEmpty();
        }

        @Test
        void shouldReturnEmptyString_WhenDeltaMissing() {
            String chunk = "{\"choices\":[{}]}";
            String token = chatService.extractToken(chunk);
            assertThat(token).isEmpty();
        }

        @Test
        void shouldReturnEmptyString_WhenJsonIsMalformed() {
            String chunk = "data: { this is not json }";
            String token = chatService.extractToken(chunk);
            assertThat(token).isEmpty();
        }

        @Test
        void shouldReturnEmptyString_WhenJsonIsEmpty() {
            String token = chatService.extractToken("");
            assertThat(token).isEmpty();
        }

        @Test
        void shouldReturnEmptyString_WhenJsonStructureUnexpected() {
            String chunk = "{\"wrong_field\":{\"oops\":123}}";
            String token = chatService.extractToken(chunk);
            assertThat(token).isEmpty();
        }

        @Test
        void shouldExtractUnicodeCharacters() {
            String chunk = "data: {\"choices\":[{\"delta\":{\"content\":\"😀✨\"}}]}";
            String token = chatService.extractToken(chunk);
            assertThat(token).isEqualTo("😀✨");
        }

        @Test
        void shouldExtractFromChunkWithMultipleFields() {
            String chunk = "data: {\"id\":\"abc\",\"choices\":[{\"delta\":{\"content\":\"World\"},\"finish_reason\":null}],\"model\":\"gpt-4\"}";
            String token = chatService.extractToken(chunk);
            assertThat(token).isEqualTo("World");
        }
    }

}
