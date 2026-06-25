package com.github.ryehlmarshmallow.oes.common.controller;

import com.github.ryehlmarshmallow.oes.common.config.TextConfig;
import com.github.ryehlmarshmallow.oes.features.storage.config.StorageConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("api/system/limits")
@RequiredArgsConstructor
public class SystemLimitsController {

    private final StorageConfig storageConfig;
    private final TextConfig textConfig;

    @GetMapping
    public SystemLimitsResponse getLimits() {
        return new SystemLimitsResponse(
            storageConfig.getMaxFileSize().toMegabytes(),
            storageConfig.getMaxFileCount(),
            storageConfig.getAllowedExtensions(),
            textConfig.getMaxCharacters()
        );
    }

    public record SystemLimitsResponse(
        long maxFileSizeMegabytes,
        int maxFileCount,
        List<String> allowedExtensions,
        int maxCharacters
    ) {
    }
}
