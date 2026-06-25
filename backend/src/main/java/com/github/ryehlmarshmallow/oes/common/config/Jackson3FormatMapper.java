package com.github.ryehlmarshmallow.oes.common.config;

import org.hibernate.type.descriptor.WrapperOptions;
import org.hibernate.type.descriptor.java.JavaType;
import org.hibernate.type.format.FormatMapper;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component("jackson3FormatMapper")
public class Jackson3FormatMapper implements FormatMapper {

    private final ObjectMapper objectMapper;

    public Jackson3FormatMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public <T> T fromString(CharSequence string, JavaType<T> javaType, WrapperOptions wrapperOptions) {
        if (string == null) {
            return null;
        }
        try {
            tools.jackson.databind.JavaType type = objectMapper.constructType(javaType.getJavaTypeClass());
            return objectMapper.readValue(string.toString(), type);
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not deserialize JSON string", e);
        }
    }

    @Override
    public <T> String toString(T value, JavaType<T> javaType, WrapperOptions wrapperOptions) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalArgumentException("Could not serialize object to JSON string", e);
        }
    }
}
