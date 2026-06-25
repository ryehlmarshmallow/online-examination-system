package com.github.ryehlmarshmallow.oes.common.config;

import com.github.ryehlmarshmallow.oes.features.grading.core.GradingRegistry;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.Rubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.RubricDeserializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.JacksonModule;
import tools.jackson.databind.module.SimpleModule;

@Configuration
public class JacksonRubricModuleConfig {

    @Bean
    public JacksonModule rubricModule(GradingRegistry gradingRegistry) {
        SimpleModule module = new SimpleModule();
        module.addDeserializer(Rubric.class, new RubricDeserializer(gradingRegistry));
        return module;
    }
}
