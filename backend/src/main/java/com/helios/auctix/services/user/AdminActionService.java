package com.helios.auctix.services.user;

import com.helios.auctix.domain.user.*;
import com.helios.auctix.domain.user.UserRequiredActionEnum;
import com.helios.auctix.dtos.AdminActionDTO;
import com.helios.auctix.exception.InvalidUserException;
import com.helios.auctix.exception.PermissionDeniedException;
import com.helios.auctix.mappers.impl.AdminActionMapperImpl;
import com.helios.auctix.repositories.AdminActionRepository;
import com.helios.auctix.repositories.SuspendedUserRepository;
import com.helios.auctix.repositories.UserRepository;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
public class AdminActionService {

    private final AdminActionRepository adminActionRepository;
    private final UserRepository userRepository;
    private final AdminActionMapperImpl adminActionMapperImpl;
    private final SuspendedUserRepository suspendedUserRepository;
    private final UserDetailsService userDetailsService;
    private final UserRegisterService userRegisterService;

    public AdminActionService(
            AdminActionRepository adminActionRepository,
            UserRepository userRepository, AdminActionMapperImpl adminActionMapperImpl, SuspendedUserRepository suspendedUserRepository, UserDetailsService userDetailsService, UserRegisterService userRegisterService) {
        this.adminActionRepository = adminActionRepository;
        this.userRepository = userRepository;
        this.adminActionMapperImpl = adminActionMapperImpl;
        this.suspendedUserRepository = suspendedUserRepository;
        this.userDetailsService = userDetailsService;
        this.userRegisterService = userRegisterService;
    }

    public void logAdminAction(User admin, User user, AdminActionsEnum action, String description) {

        if (admin == null || user == null || action == null) {
            log.error("Admin, User, or Action cannot be null");
            throw new IllegalArgumentException("Admin, User, and Action must not be null");
        }
        if(!admin.getRoleEnum().equals(UserRoleEnum.SUPER_ADMIN) && !admin.getRoleEnum().equals(UserRoleEnum.ADMIN)) {
            log.error("not an admin user");
            throw new IllegalArgumentException("only admin can be log actions");
        }
        Admin adminDetails = admin.getAdmin();
        if(admin.getRoleEnum().equals(UserRoleEnum.SUPER_ADMIN)){
            adminDetails = Admin.builder()
                            .id(admin.getId())
                            .user(admin)
                            .isActive(true)
                            .build();
        }

        // TODO: Register SuperAdmin as a Admin and save superadmin actions
        AdminAction adminAction = AdminAction.builder()
                .admin(adminDetails)
                .user(user)
                .activityType(action)
                .description(description)
                .build();

        adminActionRepository.save(adminAction);
        log.info("Admin Action has been saved successfully");

    }

    public List<AdminAction> findAllByUser(User currentUser) {

        List<AdminAction> actions = adminActionRepository.findAllByOrderByCreatedAtDesc(Pageable.ofSize(100));
        log.info("Retrieved {} admin actions for user {}", actions.size(), currentUser.getUsername());
        return actions;
    }

    /**
     * Retrieves a page of admin actions.
     *
     * @param limit required, no default \- number of records per page
     * @param offset required, no default \- page number or starting index
     * @param search not required, default is null \- search keyword, can be null
     * @param actionTypeFilter not required, default is null \- filter by action type, can be null
     * @param order required, no default \- sort order ("asc" or "desc")
     * @return a page of AdminActionDTO
     */
    public Page<AdminActionDTO> getAllAdminActions(int limit, int offset, String search, String actionTypeFilter, String order) {
        Sort sort = order.equalsIgnoreCase("asc") ? Sort.by("createdAt").ascending() : Sort.by("createdAt").descending();
        Pageable pageable = PageRequest.of(offset, limit, sort);

        Set<UUID> matchedUserIds = Set.of();
        String descriptionSearch = null;

        AdminActionsEnum actionTypeFilterEnumVal = null;
        if (actionTypeFilter != null && !actionTypeFilter.isEmpty() && !actionTypeFilter.equals("ALL")) {
            actionTypeFilterEnumVal = AdminActionsEnum.valueOf(actionTypeFilter);
        }

        if (search != null && search.toLowerCase().contains("username:")) {
            String lowerSearch = search.toLowerCase();
            int index = lowerSearch.indexOf("username:");

            int endOfUsername = search.indexOf(' ', index);
            String usernameKeyword;
            if (endOfUsername == -1) {
                usernameKeyword = search.substring(index + "username:".length()).trim();
                descriptionSearch = search.substring(0, index).trim();
            } else {
                usernameKeyword = search.substring(index + "username:".length(), endOfUsername).trim();
                descriptionSearch = (search.substring(0, index) + search.substring(endOfUsername)).trim();
            }

            matchedUserIds = getMatchedUserIds(usernameKeyword);
        } else if (search != null) {
            descriptionSearch = search;
        }

        Page<AdminAction> adminActions;

        if (matchedUserIds != null && !matchedUserIds.isEmpty()) {
            adminActions = adminActionRepository.searchAdminActions( new ArrayList<>(matchedUserIds), descriptionSearch, actionTypeFilterEnumVal, pageable);
        } else {
            adminActions = adminActionRepository.searchAdminActionsNoUserSearch(pageable, descriptionSearch, actionTypeFilterEnumVal);
        }

        log.info("Retrieved {} admin actions with limit {}, offset {}, order {}, sortBy createdAt, search {}, filterBy activity_type, filterValue {}",
                adminActions.getTotalElements(), limit, offset, order, search, actionTypeFilter);

        log.info("mapping to dto");
        Page<AdminActionDTO> adminActionsDTOPage = adminActions.map(adminActionMapperImpl::mapTo);

        return adminActionsDTOPage;
    }

    public Set<UUID> getMatchedUserIds(String usernameKeyword) {
        return userRepository
                .findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(usernameKeyword,usernameKeyword)
                .stream()
                .map(user -> ((User) user).getId())
                .collect(Collectors.toSet());
    }

    @Transactional
    public void banUser(@NotNull String targetUserUserName, @NotNull User currentUser,@NotNull String reason, SuspentionDurationEnum duration) {
        log.info("Ban request by user {}", currentUser.getEmail());

        User targetUser = userRepository.findByUsername(targetUserUserName);

        if (targetUser == null) {
            throw new InvalidUserException("User not found");
        }

        if(targetUser.isSuspended()){
            throw new InvalidUserException("User is already suspended");
        }

        if (targetUser.getRoleEnum().equals(UserRoleEnum.SUPER_ADMIN)) {
            throw new PermissionDeniedException("Cannot ban a Super Admin");
        }

        if (targetUser.getRoleEnum().equals(UserRoleEnum.ADMIN) && !currentUser.getRoleEnum().equals(UserRoleEnum.SUPER_ADMIN)) {
            throw new PermissionDeniedException("Only Super Admin can ban an Admin");
        }

        Instant suspendedUntil = null;
        if(duration != SuspentionDurationEnum.PERMANENT){
            suspendedUntil = switch (duration) {
                case ONE_DAY -> Instant.now().plusSeconds(86400);
                case THREE_DAYS -> Instant.now().plusSeconds(259200);
                case ONE_WEEK -> Instant.now().plusSeconds(604800);
                case TWO_WEEKS -> Instant.now().plusSeconds(1209600);
                case ONE_MONTH -> Instant.now().plusSeconds(2592000);
                default -> throw new IllegalArgumentException("Invalid suspension duration");
            };
        }

        targetUser.setSuspended(true);
        userRepository.save(targetUser);
        SuspendedUser suspendedUser = SuspendedUser.builder()
                .suspendedBy(currentUser)
                .reason(reason)
                .user(targetUser)
                .suspendedUntil(suspendedUntil)
                .build();
        suspendedUserRepository.save(suspendedUser);
        logAdminAction(currentUser, targetUser, AdminActionsEnum.USER_BAN, "User " + targetUser.getUsername() + " has been banned by " + currentUser.getUsername() + " for reason: " + reason + "for duration: " + duration.getDuration());

        UserRequiredActionContext userRequiredActionContext = UserRequiredActionContext.builder()
                .title("Your account has been banned")
                .content("Hello "+suspendedUser.getUser().getUsername()+" We are sorry to let you know, Your account is banned for the following reason/s: " + suspendedUser.getReason() + " for "+suspendedUser.getSuspendedUntil()+". Please contact support for more information.")
                .canResolve(false)
                .severityLevel(UserRequiredActionSeverityLevelEnum.HIGH)
                .triggerUrl(null)
                .continueUrl(null)
                .build();

        userDetailsService.registerUserRequiredAction(targetUser, UserRequiredActionEnum.ANNOUNCEMENT_READ, userRequiredActionContext);
    }

}

