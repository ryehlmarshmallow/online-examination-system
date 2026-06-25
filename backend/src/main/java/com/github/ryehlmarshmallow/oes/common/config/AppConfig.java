package com.github.ryehlmarshmallow.oes.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.List;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app")
public class AppConfig {

    private String baseUrl = "http://localhost:8080";

    private final Cors cors = new Cors();

    @Getter
    @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:5173");
    }
}

