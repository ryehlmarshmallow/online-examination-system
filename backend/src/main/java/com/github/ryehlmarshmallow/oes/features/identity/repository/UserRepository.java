package com.github.ryehlmarshmallow.oes.features.identity.repository;

import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findByUsernameIgnoreCaseOrEmailIgnoreCase(String username, String email);

    List<User> findTop10ByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrderByUsernameAsc(String usernameQuery, String emailQuery);

    @Query("""
            SELECT u FROM User u
            WHERE (LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) 
               OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%')))
              AND u.id NOT IN (
                SELECT cm.user.id FROM ClassroomMember cm
                WHERE cm.classroom.id = :classroomId AND cm.isActive = true
              )
            ORDER BY u.username ASC
            LIMIT 10
        """)
    List<User> findInviteCandidates(@Param("query") String query, @Param("classroomId") UUID classroomId);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsername(String username);
}
