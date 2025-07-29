package com.helios.auctix.repositories;

import com.helios.auctix.domain.user.UserRequiredAction;
import com.helios.auctix.domain.user.UserRequiredActionEnum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRequiredActionRepository extends JpaRepository<UserRequiredAction, UUID> {

    List<UserRequiredAction> findByUserIdAndIsResolvedFalse(UUID userId);
    boolean existsByUserIdAndActionTypeAndIsResolvedFalse(UUID userId, UserRequiredActionEnum actionType);
    List<UserRequiredAction> findByUserId(UUID userId);
    UserRequiredAction findByUserIdAndActionTypeAndIsResolvedFalse(UUID id, UserRequiredActionEnum action);

    UserRequiredAction findByUserIdAndId(UUID userId, UUID id);
}
