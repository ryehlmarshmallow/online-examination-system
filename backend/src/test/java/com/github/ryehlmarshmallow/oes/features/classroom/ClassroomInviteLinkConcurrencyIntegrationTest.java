package com.github.ryehlmarshmallow.oes.features.classroom;

import com.github.ryehlmarshmallow.oes.common.testing.PostgresIntegrationTestBase;
import com.github.ryehlmarshmallow.oes.features.classroom.entity.ClassroomRole;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomInviteLinkRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.repository.ClassroomMemberRepository;
import com.github.ryehlmarshmallow.oes.features.classroom.service.ClassroomService;
import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.identity.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest(properties = "management.health.mail.enabled=false")
class ClassroomInviteLinkConcurrencyIntegrationTest extends PostgresIntegrationTestBase {

    @Autowired
    private ClassroomService classroomService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ClassroomInviteLinkRepository classroomInviteLinkRepository;

    @Autowired
    private ClassroomMemberRepository classroomMemberRepository;

    @MockitoBean
    private JavaMailSender mailSender;

    @MockitoBean
    private StringRedisTemplate redisTemplate;

    @Test
    void shouldConsumeSingleUseInviteLinkOnlyOnceUnderConcurrentAccepts() throws Exception {
        User owner = createEnabledUser("owner-concurrent", "owner-concurrent@example.com");
        User studentA = createEnabledUser("student-a", "student-a@example.com");
        User studentB = createEnabledUser("student-b", "student-b@example.com");

        var classroom = classroomService.createClassroom(owner.getId(), "Concurrency Class", "desc");
        var inviteLink = classroomService.createInviteLink(owner.getId(), classroom.id(), Instant.now().plusSeconds(3600), 1);

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<AttemptResult> first = executor.submit(buildAcceptTask(studentA.getId(), inviteLink.token(), ready, start));
            Future<AttemptResult> second = executor.submit(buildAcceptTask(studentB.getId(), inviteLink.token(), ready, start));

            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();

            List<AttemptResult> results = List.of(first.get(10, TimeUnit.SECONDS), second.get(10, TimeUnit.SECONDS));
            long successCount = results.stream().filter(AttemptResult::success).count();
            long failureCount = results.size() - successCount;

            assertEquals(1, successCount);
            assertEquals(1, failureCount);
            assertTrue(results.stream()
                .filter(result -> !result.success())
                .allMatch(result -> "Invite link usage limit has been reached".equals(result.errorMessage())));
        }

        var persistedLink = classroomInviteLinkRepository.findDetailedByToken(inviteLink.token())
            .orElseThrow(() -> new IllegalStateException("Invite link should exist"));
        assertEquals(1, persistedLink.getUseCount());

        long activeStudents = classroomMemberRepository.countByClassroomIdAndRoleAndIsActiveTrue(classroom.id(), ClassroomRole.STUDENT);
        assertEquals(1, activeStudents);
    }

    private Callable<AttemptResult> buildAcceptTask(UUID userId, String token, CountDownLatch ready, CountDownLatch start) {
        return () -> {
            ready.countDown();
            if (!start.await(5, TimeUnit.SECONDS)) {
                return new AttemptResult(false, "Timed out waiting for start signal");
            }

            try {
                var response = classroomService.acceptInviteLink(userId, token);
                assertNotNull(response);
                return new AttemptResult(true, null);
            } catch (IllegalArgumentException ex) {
                return new AttemptResult(false, ex.getMessage());
            }
        };
    }

    private User createEnabledUser(String username, String email) {
        return userRepository.save(User.builder()
            .username(username)
            .firstName("Test")
            .middleName(null)
            .lastName("User")
            .email(email)
            .passwordHash("not-used-in-this-test")
            .isEnabled(true)
            .build());
    }

    private record AttemptResult(boolean success, String errorMessage) {
    }
}

