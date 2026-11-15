package com.shopeasy.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

@Configuration
public class MongoConfig {

    @Bean
    MongoCustomConversions mongoCustomConversions() {
        // MongoDB dates use UTC. Use the driver's UTC codecs for Java LocalDateTime as well.
        return MongoCustomConversions.create(adapter -> adapter.useNativeDriverJavaTimeCodecs());
    }
}
