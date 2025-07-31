package com.helios.auctix.repositories;

import com.helios.auctix.domain.user.AdminAction;
import com.helios.auctix.domain.user.AdminActionsEnum;
import com.helios.auctix.dtos.AdminActionDTO;
import com.helios.auctix.dtos.UserDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AdminActionRepository extends JpaRepository<AdminAction, UUID> {

    public List<AdminAction> findAllByOrderByCreatedAtDesc(Pageable pageable);

    @Query("""
    SELECT new com.helios.auctix.dtos.AdminActionDTO(
        a.id,

        adminUser.id,
        adminUser.username,
        adminUser.email,
        adminUser.firstName,
        adminUser.lastName,
        adminUser.role.name,
        adminUser.upload.id,

        user.id,
        user.username,
        user.email,
        user.firstName,
        user.lastName,
        user.role.name,
        user.upload.id,

        a.activityType,
        a.description,
        a.createdAt
    )
    FROM AdminAction a
    JOIN User user ON a.user.id = user.id
    JOIN Admin admin ON a.admin.id = admin.id
    JOIN User adminUser ON admin.id = adminUser.id
    WHERE (a.user.id IN :ids OR a.admin.id IN :ids)
      AND (:description IS NULL OR LOWER(a.description) LIKE LOWER(CONCAT('%', :description, '%')))
      AND (:actionTypeFilter IS NULL OR a.activityType = :actionTypeFilter)
    ORDER BY a.createdAt DESC
""")
    Page<AdminAction> searchAdminActions(
            @Param("ids") List<UUID> ids,
            @Param("description") String description,
            @Param("actionTypeFilter") AdminActionsEnum actionTypeFilter,
            Pageable pageable
    );

    Page<AdminAction> findByDescriptionContainingIgnoreCaseAndActivityType(Pageable pageable, String descriptionSearch, AdminActionsEnum actionTypeFilter);

    @Query("SELECT a FROM AdminAction a WHERE " +
            "(:descriptionSearch IS NULL OR LOWER(a.description) LIKE LOWER(CONCAT('%', :descriptionSearch, '%'))) AND " +
            "(:actionTypeFilterEnumVal IS NULL OR a.activityType = :actionTypeFilterEnumVal)")
    Page<AdminAction> searchAdminActionsNoUserSearch(
            Pageable pageable,
            @Param("descriptionSearch") String descriptionSearch,
            @Param("actionTypeFilterEnumVal") AdminActionsEnum actionTypeFilterEnumVal
    );
}