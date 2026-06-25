package com.github.ryehlmarshmallow.oes.common.config;

import org.junit.jupiter.api.Test;
import org.yaml.snakeyaml.Yaml;

import java.io.InputStream;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ProductionOpenApiPropertiesTest {

    @Test
    @SuppressWarnings("unchecked")
    void openApiShouldBeDisabledInProductionProfile() throws Exception {
        try (InputStream inputStream = getClass().getClassLoader().getResourceAsStream("application-prod.yml")) {
            assertNotNull(inputStream, "application-prod.yml must exist");

            Yaml yaml = new Yaml();
            Map<String, Object> obj = yaml.load(inputStream);
            assertNotNull(obj);

            Map<String, Object> springdoc = (Map<String, Object>) obj.get("springdoc");
            assertNotNull(springdoc);

            Map<String, Object> apiDocs = (Map<String, Object>) springdoc.get("api-docs");
            assertNotNull(apiDocs);
            assertEquals(false, apiDocs.get("enabled"));

            Map<String, Object> swaggerUi = (Map<String, Object>) springdoc.get("swagger-ui");
            assertNotNull(swaggerUi);
            assertEquals(false, swaggerUi.get("enabled"));
        }
    }
}

