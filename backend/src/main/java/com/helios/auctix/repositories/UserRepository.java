package com.helios.auctix.repositories;

import com.helios.auctix.domain.user.User;
import com.helios.auctix.dtos.UserDTO;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;


import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User,UUID> , JpaSpecificationExecutor<User> {
    boolean existsById(UUID Id);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    User findByEmail(String email);
    Page<User> findAll(Pageable pageable);

    User findByUsername(String username);

    Page<User> findAll(Specification<User> spec, Pageable pageable);

    long countByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(String search,String search1);

    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrFirstNameContainingIgnoreCaseOrLastNameContainingIgnoreCase(String username, String email, String firstName, String lastName, Pageable pageable);

    Collection<Object> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(String usernameKeyword,String emailKeyword);

    public interface RoleUserCount {
        String getRoleName();
        Long getUserCount();
    }

    @Query("SELECT u.role.name as roleName, COUNT(u) as userCount FROM User u GROUP BY u.role.name")
    List<RoleUserCount> countUsersByRole();

}
