package com.shopeasy.config;

import java.net.http.HttpClient;
import java.time.Duration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

@Configuration
public class CloudinaryConfig {

    @Bean
    RestClient cloudinaryClient(RestClient.Builder builder) {
        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8)).build();
        JdkClientHttpRequestFactory requests = new JdkClientHttpRequestFactory(client);
        requests.setReadTimeout(Duration.ofSeconds(25));
        return builder.requestFactory(requests).baseUrl("https://api.cloudinary.com").build();
    }
}
