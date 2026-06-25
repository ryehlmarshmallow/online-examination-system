package com.github.ryehlmarshmallow.oes.common.config;

import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.BaseRubric;
import com.github.ryehlmarshmallow.oes.features.question.entity.rubric.RubricFor;
import org.springframework.beans.factory.config.BeanDefinition;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ClassPathScanningCandidateComponentProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.type.filter.AnnotationTypeFilter;
import org.springframework.util.ClassUtils;

import java.util.LinkedHashSet;
import java.util.Set;

@Configuration
public class RubricDiscoveryConfig {

    private static final String RUBRIC_PACKAGE = "com.github.ryehlmarshmallow.oes.features.question.entity.rubric";

    @Bean
    public Set<Class<? extends BaseRubric>> rubricClasses() {
        ClassPathScanningCandidateComponentProvider scanner = new ClassPathScanningCandidateComponentProvider(false);
        scanner.addIncludeFilter(new AnnotationTypeFilter(RubricFor.class));

        Set<Class<? extends BaseRubric>> rubricClasses = new LinkedHashSet<>();
        ClassLoader classLoader = ClassUtils.getDefaultClassLoader();

        for (BeanDefinition candidate : scanner.findCandidateComponents(RUBRIC_PACKAGE)) {
            String className = candidate.getBeanClassName();
            if (className == null) {
                continue;
            }

            Class<?> discoveredClass;
            try {
                discoveredClass = ClassUtils.forName(className, classLoader);
            } catch (ClassNotFoundException ex) {
                throw new IllegalStateException("Could not load discovered rubric class: " + className, ex);
            }

            if (!BaseRubric.class.isAssignableFrom(discoveredClass)) {
                throw new IllegalStateException("Rubric class " + className + " must extend BaseRubric");
            }

            @SuppressWarnings("unchecked")
            Class<? extends BaseRubric> rubricClass = (Class<? extends BaseRubric>) discoveredClass;
            rubricClasses.add(rubricClass);
        }

        return Set.copyOf(rubricClasses);
    }
}

