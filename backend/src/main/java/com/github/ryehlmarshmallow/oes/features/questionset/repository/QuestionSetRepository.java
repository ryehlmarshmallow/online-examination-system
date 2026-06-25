package com.github.ryehlmarshmallow.oes.features.questionset.repository;

import com.github.ryehlmarshmallow.oes.features.questionset.entity.QuestionSet;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface QuestionSetRepository extends JpaRepository<QuestionSet, UUID> {

    @EntityGraph(attributePaths = {
        "questionSetQuestionGroups",
        "questionSetQuestionGroups.questionGroup",
        "questionSetQuestionGroups.questionGroup.questions"
    })
    @Query("""
        SELECT q
        FROM QuestionSet q
        JOIN HierarchyNode n ON n.content.id = q.id
        WHERE q.id = :id AND n.ownerUser.id = :ownerUserId
        """)
    Optional<QuestionSet> findDetailedByIdAndOwnerUserId(@Param("id") UUID id, @Param("ownerUserId") UUID ownerUserId);

    @EntityGraph(attributePaths = {
        "questionSetQuestionGroups",
        "questionSetQuestionGroups.questionGroup",
        "questionSetQuestionGroups.questionGroup.questions"
    })
    @Query("""
        SELECT q
        FROM QuestionSet q
        JOIN HierarchyNode n ON n.content.id = q.id
        WHERE q.id IN :ids AND n.ownerUser.id = :ownerUserId
        """)
    List<QuestionSet> findDetailedByIdsAndOwnerUserId(@Param("ids") Collection<UUID> ids, @Param("ownerUserId") UUID ownerUserId);
}
