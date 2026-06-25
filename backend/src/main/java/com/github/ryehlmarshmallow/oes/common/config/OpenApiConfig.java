package com.github.ryehlmarshmallow.oes.common.config;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.info.Info;
import org.springframework.context.annotation.Configuration;

@Configuration
@OpenAPIDefinition(
    info = @Info(
        title = "Online Examination System API",
        version = "v1",
        description = "REST API documentation for the Online Examination System backend."
    )
)
public class OpenApiConfig {
}

