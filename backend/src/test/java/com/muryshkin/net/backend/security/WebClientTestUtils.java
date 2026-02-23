package com.muryshkin.net.backend.security;

import org.springframework.test.context.TestPropertySource;
import org.springframework.web.reactive.function.client.ClientRequest;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.ExchangeFunction;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Utility class to create mock WebClient instances for testing.
 */
@TestPropertySource(locations = "classpath:application-test.properties")
public class WebClientTestUtils {

    /**
     * Creates a WebClient mock that always returns the provided response.
     *
     * @param response the response to return from exchange
     * @return WebClient instance that will return the provided response
     */
    public static WebClient createMockWebClient(Mono<ClientResponse> response) {
        ExchangeFunction exchangeFunction = mock(ExchangeFunction.class);
        when(exchangeFunction.exchange(any(ClientRequest.class))).thenReturn(response);
        return WebClient.builder().exchangeFunction(exchangeFunction).build();
    }
}
