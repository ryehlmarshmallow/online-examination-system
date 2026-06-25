package com.github.ryehlmarshmallow.oes.features.hierarchy.repository;

import com.github.ryehlmarshmallow.oes.features.hierarchy.entity.HierarchyNode;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.DomainType;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.NodeType;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HierarchyNodeRepository extends JpaRepository<HierarchyNode, UUID> {

    Optional<HierarchyNode> findByIdAndOwnerUserIdAndDomainType(UUID id, UUID ownerUserId, DomainType domainType);

    List<HierarchyNode> findByIdInAndOwnerUserIdAndDomainType(Collection<UUID> ids, UUID ownerUserId, DomainType domainType);

    List<HierarchyNode> findByOwnerUserIdAndDomainTypeAndParentId(UUID ownerUserId, DomainType domainType, UUID parentId, Sort sort);

    @Query("""
        SELECT n
        FROM HierarchyNode n
        WHERE n.ownerUser.id = :userId
          AND n.domainType = :domainType
          AND ((:parentId IS NULL AND n.parent IS NULL) OR n.parent.id = :parentId)
        """)
    Page<HierarchyNode> findPaginatedContent(
        @Param("userId") UUID userId,
        @Param("domainType") DomainType domainType,
        @Param("parentId") UUID parentId,
        Pageable pageable
    );

    @Query("""
        SELECT n
        FROM HierarchyNode n
        WHERE n.id = :id
          AND n.ownerUser.id = :userId
          AND n.domainType = :domainType
          AND n.nodeType = :nodeType
        """)
    Optional<HierarchyNode> findOwnedNodeByType(
        @Param("id") UUID id,
        @Param("userId") UUID userId,
        @Param("domainType") DomainType domainType,
        @Param("nodeType") NodeType nodeType
    );

    @Query("""
        SELECT n
        FROM HierarchyNode n
        WHERE n.ownerUser.id = :userId
          AND n.domainType = :domainType
          AND ((:parentId IS NULL AND n.parent IS NULL) OR n.parent.id = :parentId)
          AND n.nodeType = :nodeType
        ORDER BY n.orderIndex ASC, n.id ASC
        """)
    List<HierarchyNode> findTypeSpecificSiblings(
        @Param("userId") UUID userId,
        @Param("domainType") DomainType domainType,
        @Param("parentId") UUID parentId,
        @Param("nodeType") NodeType nodeType
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT n
        FROM HierarchyNode n
        WHERE n.ownerUser.id = :userId
          AND n.domainType = :domainType
          AND ((:parentId IS NULL AND n.parent IS NULL) OR n.parent.id = :parentId)
          AND n.nodeType = :nodeType
        ORDER BY n.orderIndex ASC, n.id ASC
        """)
    List<HierarchyNode> findTypeSpecificSiblingsForUpdate(
        @Param("userId") UUID userId,
        @Param("domainType") DomainType domainType,
        @Param("parentId") UUID parentId,
        @Param("nodeType") NodeType nodeType
    );

    @Query(value = """
        SELECT *
        FROM hierarchy_nodes
        WHERE owner_user_id = :ownerUserId
          AND domain_type = CAST(:domainType AS varchar)
          AND path <@ CAST(:path AS ltree)
        ORDER BY NLEVEL(path) DESC
        """, nativeQuery = true)
    List<HierarchyNode> findSubtree(
        @Param("ownerUserId") UUID ownerUserId,
        @Param("domainType") String domainType,
        @Param("path") String path
    );

    List<HierarchyNode> findByOwnerUserIdAndDomainTypeAndNodeTypeOrderByOrderIndexAsc(UUID ownerUserId, DomainType domainType, NodeType nodeType);

    List<HierarchyNode> findByOwnerUserIdAndDomainTypeOrderByOrderIndexAsc(UUID ownerUserId, DomainType domainType);

    List<HierarchyNode> findByOwnerUserIdAndDomainTypeAndParentIdOrderByOrderIndexAsc(UUID ownerUserId, DomainType domainType, UUID parentId);

    Optional<HierarchyNode> findFirstByOwnerUserIdAndDomainTypeAndParentIdOrderByOrderIndexAsc(UUID ownerUserId, DomainType domainType, UUID parentId);

    Optional<HierarchyNode> findFirstByOwnerUserIdAndDomainTypeAndParentIdAndOrderIndexGreaterThanOrderByOrderIndexAsc(UUID ownerUserId, DomainType domainType, UUID parentId, double orderIndex);
}
