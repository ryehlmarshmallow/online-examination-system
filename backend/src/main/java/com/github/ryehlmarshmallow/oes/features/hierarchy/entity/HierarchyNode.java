package com.github.ryehlmarshmallow.oes.features.hierarchy.entity;

import com.github.ryehlmarshmallow.oes.features.identity.entity.User;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.DomainType;
import com.github.ryehlmarshmallow.oes.features.questionset.entity.NodeType;
import io.hypersistence.utils.hibernate.type.basic.PostgreSQLLTreeType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Type;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "hierarchy_nodes")
@Getter
@Setter
@NoArgsConstructor
public class HierarchyNode {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String name;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "modified_at", nullable = false)
    private Instant modifiedAt = Instant.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private HierarchyNode parent;

    @Type(PostgreSQLLTreeType.class)
    @Column(name = "path", columnDefinition = "ltree", nullable = false)
    private String path;

    @Column(name = "order_index", nullable = false)
    private Double orderIndex;

    @Enumerated(EnumType.STRING)
    @Column(name = "node_type", nullable = false, updatable = false)
    private NodeType nodeType;

    @Enumerated(EnumType.STRING)
    @Column(name = "domain_type", nullable = false)
    private DomainType domainType;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_type")
    private ContentType contentType;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_user_id", nullable = false, updatable = false)
    private User ownerUser;

    @OneToOne(fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JoinColumn(name = "content_id")
    private BaseContent content;

    public HierarchyNode(String name, NodeType nodeType, DomainType domainType, HierarchyNode parent, Double orderIndex, User ownerUser) {
        this.name = name;
        this.nodeType = nodeType;
        this.domainType = domainType;
        this.parent = parent;
        this.orderIndex = orderIndex;
        this.ownerUser = ownerUser;
    }

    public void markModified() {
        this.modifiedAt = Instant.now();
    }
}
