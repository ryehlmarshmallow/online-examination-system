package com.github.ryehlmarshmallow.oes.common.config;

import org.hibernate.cfg.AvailableSettings;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

@Configuration
public class HibernateConfig {

    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer(Jackson3FormatMapper formatMapper) {
        return (Map<String, Object> hibernateProperties) -> {
            hibernateProperties.put(
                AvailableSettings.JSON_FORMAT_MAPPER,
                formatMapper
            );
        };
    }
}
