package com.helios.auctix.repositories;

import com.helios.auctix.domain.user.SuspendedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface SuspendedUserRepository extends JpaRepository<SuspendedUser, UUID> {
}
