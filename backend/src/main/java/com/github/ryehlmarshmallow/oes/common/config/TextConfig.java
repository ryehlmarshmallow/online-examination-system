package com.github.ryehlmarshmallow.oes.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.text")
public class TextConfig {
    private Integer maxCharacters = 20000;
}
