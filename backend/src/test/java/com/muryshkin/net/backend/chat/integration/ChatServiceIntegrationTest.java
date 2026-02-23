//package com.muryshkin.net.backend.chat.integration;
//
//import com.muryshkin.net.backend.chat.entity.ChatMessage;
//import com.muryshkin.net.backend.chat.repository.ChatMessageRepository;
//import com.muryshkin.net.backend.security.JwtTokenService;
//import okhttp3.mockwebserver.MockResponse;
//import okhttp3.mockwebserver.MockWebServer;
//import org.jetbrains.annotations.NotNull;
//import org.junit.jupiter.api.AfterAll;
//import org.junit.jupiter.api.BeforeAll;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.TestInstance;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.boot.test.util.TestPropertyValues;
//import org.springframework.context.ApplicationContextInitializer;
//import org.springframework.context.ConfigurableApplicationContext;
//import org.springframework.test.context.ContextConfiguration;
//import org.springframework.test.context.TestPropertySource;
//import org.springframework.test.web.reactive.server.WebTestClient;
//import reactor.test.StepVerifier;
//
//import java.io.IOException;
//import java.util.List;
//
//import static org.assertj.core.api.Assertions.assertThat;
//
//@SpringBootTest
//@AutoConfigureWebTestClient
//@ContextConfiguration(initializers = ChatServiceIntegrationTest.Initializer.class)
//@TestInstance(TestInstance.Lifecycle.PER_CLASS)
//@TestPropertySource(locations = "classpath:application-test.properties")
//public class ChatServiceIntegrationTest {
//
//    @Autowired
//    private WebTestClient webTestClient;
//
//    @Autowired
//    private ChatMessageRepository chatMessageRepository;
//
//    @Autowired
//    private JwtTokenService jwtTokenService;
//
//    static MockWebServer mockOpenAi;
//
//    @BeforeAll
//    static void setup() throws IOException {
//        mockOpenAi = new MockWebServer();
//        mockOpenAi.start();
//    }
//
//    @AfterAll
//    static void tearDown() throws IOException {
//        mockOpenAi.shutdown();
//    }
//
//    static class Initializer implements ApplicationContextInitializer<ConfigurableApplicationContext> {
//        public void initialize(@NotNull ConfigurableApplicationContext context) {
//            TestPropertyValues.of(
//                    "openai.base-url=http://localhost:" + mockOpenAi.getPort()
//            ).applyTo(context);
//        }
//    }
//
//    @Test
//    void shouldStreamChatAndPersistMessages() {
//        mockOpenAi.enqueue(new MockResponse()
//                .setHeader("Content-Type", "text/event-stream")
//                .setBody("""
//                        data: {"choices":[{"delta":{"content":"Hello"}}]}
//                        data: {"choices":[{"delta":{"content":" World"}}]}
//                        data: [DONE]
//                        """));
//
//        webTestClient.get()
//                .uri(uriBuilder -> uriBuilder
//                        .path("/api/chat/stream")
//                        .queryParam("message", "Hi")
//                        .build())
//                .header("Authorization", "Bearer mock-token")
//                .exchange()
//                .expectStatus().isOk()
//                .returnResult(String.class)
//                .getResponseBody()
//                .as(StepVerifier::create)
//                .expectNext("Hello", " World")
//                .verifyComplete();
//
//        List<ChatMessage> messages = chatMessageRepository
//                .findBySessionIdOrderByIdAsc("test-session")
//                .collectList()
//                .block();
//
//        assertThat(messages).hasSize(2);
//        assertThat(messages.get(0).getRole()).isEqualTo("user");
//        assertThat(messages.get(1).getRole()).isEqualTo("assistant");
//        assertThat(messages.get(1).getContent()).isEqualTo("Hello World");
//    }
//
//    @Test
//    void shouldHandleMalformedOpenAiResponseAndNotSaveAssistantMessage() {
//        mockOpenAi.enqueue(new MockResponse()
//                .setHeader("Content-Type", "text/event-stream")
//                .setBody("data: { invalid json }\n"));
//
//        webTestClient.get()
//                .uri(uriBuilder -> uriBuilder
//                        .path("/api/chat/stream")
//                        .queryParam("message", "Hey?")
//                        .build())
//                .header("Authorization", "Bearer mock-token")
//                .exchange()
//                .expectStatus().is5xxServerError();
//
//        List<ChatMessage> messages = chatMessageRepository
//                .findBySessionIdOrderByIdAsc("test-session")
//                .collectList()
//                .block();
//
//        assertThat(messages).hasSize(1);
//        assertThat(messages.get(0).getRole()).isEqualTo("user");
//        assertThat(messages.get(0).getContent()).isEqualTo("Hey?");
//    }
//
//    @Test
//    void shouldStreamTokensEvenWithoutDoneMarker() {
//        mockOpenAi.enqueue(new MockResponse()
//                .setHeader("Content-Type", "text/event-stream")
//                .setBody("""
//                        data: {"choices":[{"delta":{"content":"Partial"}}]}
//                        data: {"choices":[{"delta":{"content":" Response"}}]}
//                        """));
//
//        webTestClient.get()
//                .uri(uriBuilder -> uriBuilder
//                        .path("/api/chat/stream")
//                        .queryParam("message", "Incomplete?")
//                        .build())
//                .header("Authorization", "Bearer mock-token")
//                .exchange()
//                .expectStatus().isOk()
//                .returnResult(String.class)
//                .getResponseBody()
//                .as(StepVerifier::create)
//                .expectNext("Partial", " Response")
//                .verifyComplete();
//
//        List<ChatMessage> messages = chatMessageRepository
//                .findBySessionIdOrderByIdAsc("test-session")
//                .collectList()
//                .block();
//
//        assertThat(messages).hasSize(2);
//        assertThat(messages.get(1).getRole()).isEqualTo("assistant");
//        assertThat(messages.get(1).getContent()).isEqualTo("Partial Response");
//    }
//}