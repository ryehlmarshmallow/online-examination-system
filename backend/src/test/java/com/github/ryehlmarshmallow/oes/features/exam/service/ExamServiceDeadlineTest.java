package com.github.ryehlmarshmallow.oes.features.exam.service;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class ExamServiceDeadlineTest {

    private final ExamService examService = new ExamService(null, null, null, null, null, null, null, null, null, null);

    @Test
    void testCalculateDeadline_BothNull() {
        assertNull(examService.calculateDeadline(Instant.now(), null, null));
    }

    @Test
    void testCalculateDeadline_DurationOnly() {
        Instant startedAt = Instant.parse("2026-05-17T10:00:00Z");
        Duration duration = Duration.ofMinutes(60);
        Instant expected = Instant.parse("2026-05-17T11:00:00Z");
        assertEquals(expected, examService.calculateDeadline(startedAt, duration, null));
    }

    @Test
    void testCalculateDeadline_EndTimeOnly() {
        Instant startedAt = Instant.parse("2026-05-17T10:00:00Z");
        Instant endTime = Instant.parse("2026-05-17T12:00:00Z");
        assertEquals(endTime, examService.calculateDeadline(startedAt, null, endTime));
    }

    @Test
    void testCalculateDeadline_DurationWins() {
        Instant startedAt = Instant.parse("2026-05-17T10:00:00Z");
        Duration duration = Duration.ofMinutes(30);
        Instant endTime = Instant.parse("2026-05-17T11:00:00Z");
        Instant expected = Instant.parse("2026-05-17T10:30:00Z");
        assertEquals(expected, examService.calculateDeadline(startedAt, duration, endTime));
    }

    @Test
    void testCalculateDeadline_EndTimeWins() {
        Instant startedAt = Instant.parse("2026-05-17T10:00:00Z");
        Duration duration = Duration.ofMinutes(120);
        Instant endTime = Instant.parse("2026-05-17T11:00:00Z");
        Instant expected = Instant.parse("2026-05-17T11:00:00Z");
        assertEquals(expected, examService.calculateDeadline(startedAt, duration, endTime));
    }
}
