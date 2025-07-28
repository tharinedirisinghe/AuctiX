package com.helios.auctix.services.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.helios.auctix.domain.notification.Notification;
import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.user.*;
import com.helios.auctix.domain.user.UserRequiredAction;
import com.helios.auctix.domain.user.UserRequiredActionEnum;
import com.helios.auctix.dtos.ProfileUpdateDataDTO;
import com.helios.auctix.dtos.UserDTO;
import com.helios.auctix.dtos.UserStatsDTO;
import com.helios.auctix.exception.PermissionDeniedException;
import com.helios.auctix.mappers.impl.UserMapperImpl;
import com.helios.auctix.repositories.*;
import com.helios.auctix.services.notification.senders.EmailNotificationSender;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotNull;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.websocket.AuthenticationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.naming.LimitExceededException;
import java.security.InvalidParameterException;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class UserDetailsService {

private final UserRepository userRepository;
    private final UserRequiredActionRepository userRequiredActionRepository;
    private final UserAddressRepository userAddressRepository;
    private final UserMapperImpl userMapperImpl;
    private final UserRoleRepository userRoleRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetRequestRepository passwordResetRequestRepository;
    private final EmailNotificationSender emailNotificationSender;

    @Autowired
    public UserDetailsService(
            UserRepository userRepository,
            UserRequiredActionRepository userRequiredActionRepository,
            UserAddressRepository userAddressRepository,
            UserMapperImpl userMapperImpl,
            UserRoleRepository userRoleRepository,
            PasswordEncoder passwordEncoder,
            PasswordResetRequestRepository passwordResetRequestRepository,
            EmailNotificationSender emailNotificationSender
    ) {
        this.userRepository = userRepository;
        this.userRequiredActionRepository = userRequiredActionRepository;
        this.userAddressRepository = userAddressRepository;
        this.userMapperImpl = userMapperImpl;
        this.userRoleRepository = userRoleRepository;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetRequestRepository = passwordResetRequestRepository;
        this.emailNotificationSender = emailNotificationSender;
    }


    /**
     * Retrieves a user by {@link Authentication}.
     *
     * @return the User object associated with current user
     * @throws UsernameNotFoundException if no user is found
     */
    public User getAuthenticatedUser(Authentication authentication) throws AuthenticationException,UsernameNotFoundException {
        String userEmail = null;
        if (authentication == null || authentication.getAuthorities() == null || !authentication.isAuthenticated()) {
            throw new AuthenticationException("User not authenticated");
        }
        userEmail = authentication.getName();
        if (userEmail == null || userEmail.equalsIgnoreCase("anonymousUser")) {
            throw new AuthenticationException("User not authenticated");
        }

        User user = userRepository.findByEmail(userEmail);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + userEmail);
        }

        return user;
    }


    /**
     * Retrieves a paginated list of users with optional sorting and search functionality.
     *
     * @param limit  the maximum number of users to retrieve per page. Must be a positive integer and less than or equal to 100.
     * @param offset the page number to retrieve. Must be a non-negative integer.
     * @param order  the sorting order, either "asc" for ascending or "desc" for descending.
     * @param sortBy the field to sort by. Valid values are "id", "username", "email", "firstName", and "lastName".
     * @param search an optional search string to filter users by username, email, first name, or last name. If null or empty, no filtering is applied.
     * @return a paginated {@link Page} of {@link User} objects matching the criteria.
     * @throws InvalidParameterException if any of the parameters are invalid:
     *                                   - limit or offset is negative.
     *                                   - limit exceeds 100.
     *                                   - sortBy is not one of the valid fields.
     *                                   - order is not "asc" or "desc".
     */
    public Page<UserDTO> getAllUsers(int limit, int offset, String order, String sortBy, String search, String filterBy, String filterValue) {

        // validate limit and offset
        if (limit < 0 || offset < 0) {
            throw new InvalidParameterException("Error: limit and offset must be positive");
        }
        if(limit > 100) {
            throw new InvalidParameterException("Error: limit must be less than or equal to 100");
        }

        // validate sortBy and order
        List<String> validSortFields = Arrays.asList("id", "username", "email", "firstName" , "lastName");
        if (!validSortFields.contains(sortBy)) {
            throw new InvalidParameterException("Error: Invalid sortby value. Valid values: id, username, email, role");
        }
        if (!order.equalsIgnoreCase("asc") && !order.equalsIgnoreCase("desc")) {
            throw new InvalidParameterException("Error: Invalid order value. Valid values: asc, desc");
        }

        // validate filterBy and filterValue
        // sample values filterBy=[%22role%22]
        // filterValue=[[%22BIDDER%22,%22SELLER%22,%22ADMIN%22,%22SUPER_ADMIN%22]]
        List<List<String>> filterValues = null;
        List<String> filterByList = null;
        if (filterBy != null && filterValue != null) {
            try {
                // Parse filterValue as JSON array of arrays
                ObjectMapper mapper = new ObjectMapper();
                filterValues = mapper.readValue(filterValue, List.class);

                // parse filterBy as JSON array
                filterByList = mapper.readValue(filterBy, List.class);

                for (int i = 0; i < filterByList.size(); i++) {
                    String filterByItem = filterByList.get(i);
                    if ("role".equals(filterByItem)) {
                        List<String> filterValueItem = filterValues.get(i);
                        List<String> validRoles = Arrays.stream(UserRoleEnum.values()).map(Enum::name).toList();

                        // going through each role in filterValueItem related to filterByItem "role"
                        for (String role : filterValueItem) {
                            if (role == null || role.isEmpty()) {
                                throw new InvalidParameterException("Role cannot be null or empty in filterValue");
                            }
                            // Check if the role is valid
                            if (!validRoles.contains(role)) {
                                throw new InvalidParameterException("Invalid role in filterValue: " + role);
                            }
                        }

                    }
                    // Can add more filterBy conditions here if needed
                    else {
                        throw new InvalidParameterException("Invalid filterBy value: " + filterByItem);
                    }
                }
            } catch (Exception e) {
                throw new InvalidParameterException("Invalid filterValue format: " + e.getMessage());
            }
        }




        Sort.Direction direction = order.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, sortBy);

        // Add additional sort fields from filterBy if present and valid
        Page<UserDTO> userPage = null;
        if (filterBy != null && filterByList != null) {
            ObjectMapper mapper = new ObjectMapper();
            try {
                for (String filterField : filterByList) {
                    if (validSortFields.contains(filterField) && !filterField.equals(sortBy)) {
                        sort = sort.and(Sort.by(direction, filterField));
                    }
                }

                Pageable pageable = PageRequest.of(offset, limit, sort);

                Specification<User> spec = getUserSpecification(search, filterByList, filterValues);

                Page<User> temp = userRepository.findAll(spec, pageable);
                userPage = temp.map(userMapperImpl::mapTo);

            } catch (Exception e) {
                throw new InvalidParameterException("Invalid filterBy format: " + e.getMessage());
            }
        }

        return userPage;

    }

    private Specification<User> getUserSpecification(String search, List<String> filterByList, List<List<String>> filterValues) {
        Specification<User> spec = UserSpecification.getFilteredSpec(filterByList, filterValues, userRoleRepository);

        if (search != null && !search.trim().isEmpty()) {
            Specification<User> searchSpec = (root, query, cb) -> cb.or(
                    cb.like(cb.lower(root.get("username")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("email")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("firstName")), "%" + search.toLowerCase() + "%"),
                    cb.like(cb.lower(root.get("lastName")), "%" + search.toLowerCase() + "%")
            );

            spec = spec == null ? searchSpec : spec.and(searchSpec);
        }

        return spec;
    }


    public UserServiceResponse updateUserProfile(User user, ProfileUpdateDataDTO profileData) {
    log.info("Updating user profile" + profileData.getBio() + "  " + profileData.getFirstName() + " " + profileData.getLastName());

    user.setFirstName(profileData.getFirstName());
    user.setLastName(profileData.getLastName());

    UserAddress address;
    if(user.getUserAddress() != null) {
        address = userAddressRepository.findById(user.getUserAddress().getId()).orElse(new UserAddress());
    }
    else{
        address = new UserAddress();
    }
    if (profileData.getAddress() != null) {
        address.setCountry(profileData.getAddress().getCountry());
        address.setAddressNumber(profileData.getAddress().getAddressNumber());
        address.setAddressLine1(profileData.getAddress().getAddressLine1());
        address.setAddressLine2(profileData.getAddress().getAddressLine2());
        address.setUser(user);
    }
    userAddressRepository.save(address);
    userRepository.save(user);
    log.info("Updated user profile");

    this.resolveUserRequiredAction(user, UserRequiredActionEnum.COMPLETE_PROFILE);
    log.info("Resolved required action COMPLETE_PROFILE for user: {}", user.getUsername());

    return new UserServiceResponse(true, "User profile updated successfully");
}

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id).orElse(null);
    }

    public List<UserRequiredAction> getRequiredActions(User currentUser) {
        List<UserRequiredAction> requiredActions = userRequiredActionRepository.findByUserIdAndIsResolvedFalse(currentUser.getId());

        if (requiredActions == null || requiredActions.isEmpty()) {
            log.info("No required actions found for user: {}", currentUser.getUsername());
            return List.of();
        } else {
            log.info("Found {} required actions for user: {}", requiredActions.size(), currentUser.getUsername());
            return requiredActions;
        }
    }

    public void registerUserRequiredAction(User user, UserRequiredActionEnum action) {
        registerUserRequiredAction(user, action, null);
    }

    public void registerUserRequiredAction(User user, UserRequiredActionEnum action ,UserRequiredActionContext context) {
        if (action == null) {
            throw new InvalidParameterException("Action cannot be null");
        }

        boolean exists = userRequiredActionRepository.existsByUserIdAndActionTypeAndIsResolvedFalse(user.getId(), action);
        if (exists) {
            log.warn("Required action {} already exists for user: {}", action, user.getUsername());
            throw new InvalidParameterException("Required action already exists for user: " + user.getUsername());
        }

        UserRequiredAction requiredAction = UserRequiredAction.builder()
                .user(user)
                .actionType(action)
                .isResolved(false)
                .context(context!=null?context.toMap():null)
                .build();

        userRequiredActionRepository.save(requiredAction);
    }

    public void resolveUserRequiredAction(User user, UserRequiredActionEnum action) {
        if (action == null) {
            throw new InvalidParameterException("Action cannot be null");
        }

        UserRequiredAction requiredAction = userRequiredActionRepository.findByUserIdAndActionTypeAndIsResolvedFalse(user.getId(), action);
        if (requiredAction == null) {
            log.info("No required action {} found for user: {}", action, user.getUsername());
            return;
        }

        requiredAction.setResolved(true);
        requiredAction.setResolvedAt(java.time.LocalDateTime.now());
        userRequiredActionRepository.save(requiredAction);
        log.info("Resolved required action {} for user: {}", action, user.getUsername());
    }

    public UserServiceResponse changePassword(User currentUser, String oldPassword, String newPassword) {
        if (currentUser == null) {
            return new UserServiceResponse(false, "Current user is null");
        }
        if (oldPassword == null || oldPassword.isEmpty()) {
            return new UserServiceResponse(false, "Old password is empty");
        }
        if (newPassword == null || newPassword.isEmpty()) {
            return new UserServiceResponse(false, "New password is empty");
        }
        if (newPassword.contentEquals(oldPassword)) {
            return  new UserServiceResponse(false, "New password cannot be the same as old password");
        }
        // encode the passwords
        String encodedNewPassword = passwordEncoder.encode(newPassword);

        // check if the old password matches the current user's password
        if (!passwordEncoder.matches(oldPassword, currentUser.getPasswordHash())) {
            throw new InvalidParameterException("Old password does not match current password");
        }
        // update the user's password
        currentUser.setPasswordHash(encodedNewPassword);
        currentUser = userRepository.save(currentUser);
        return  new UserServiceResponse(true, "Password changed successfully", currentUser);
    }

    public UserServiceResponse resetPassword(String email, String code, String newPassword) {
        if (email == null || email.isEmpty()) {
            return new UserServiceResponse(false, "Email cannot be null or empty");
        }
        if (code == null || code.isEmpty()) {
            return new UserServiceResponse(false, "Code cannot be null or empty");
        }
        if (newPassword == null || newPassword.isEmpty()) {
            return new UserServiceResponse(false, "New password cannot be null or empty");
        }

        // check if the reset code is valid and not expired
        PasswordResetRequest resetRequest = passwordResetRequestRepository.findTopByExpiresAtAfterAndEmailAndCodeAndIsUsedFalseOrderByCreatedAtDesc(Instant.now(), email, code);
        if(resetRequest==null){
            return new UserServiceResponse(false, "Invalid or expired reset code");
        }

        // encode the new password
        String encodedNewPassword = passwordEncoder.encode(newPassword);
        User user = resetRequest.getUser();
        if (user == null) {
            return new UserServiceResponse(false, "User not found with email: " + resetRequest.getEmail());
        }

        // update the user's password
        user.setPasswordHash(encodedNewPassword);
        user = userRepository.save(user);

        return new UserServiceResponse(true, "Password changed successfully", user);
    }

    // genarate a password reset code for the user
    public PasswordResetRequest generatePasswordResetCode(String email, String ipAddress) throws LimitExceededException {
        if (email == null || email.isEmpty()) {
            throw new InvalidParameterException("Email cannot be null or empty");
        }
        if (ipAddress == null || ipAddress.isEmpty()) {
            throw new InvalidParameterException("IP address cannot be null or empty");
        }

        // check if the user exists
        User user = userRepository.findByEmail(email);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with email: " + email);
        }

        // check if there is an unexpired existing password reset request for the user
        Integer reqCount = passwordResetRequestRepository.countByExpiresAtAfterAndEmailAndIpAddressAndIsUsedFalseOrderByCreatedAtDesc(Instant.now(), email, ipAddress);

        if (reqCount != null && reqCount > 3) {
            throw new LimitExceededException("Too many password reset requests for this email or ip. Please try again later.");
        }

        // create a new password reset request
        String code = generateRandomSixCharCode();
        PasswordResetRequest resetRequest = PasswordResetRequest.builder()
                .email(email)
                .ipAddress(ipAddress)
                .code(code)
                .isUsed(false)
                .user(user)
                .build();

        return passwordResetRequestRepository.save(resetRequest);
    }

    private String generateRandomSixCharCode() {
        StringBuilder code = new StringBuilder();
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (int i = 0; i < 6; i++) {
                int randomIndex = (int) (Math.random() * chars.length());
                code.append(chars.charAt(randomIndex));
            }
        return code.toString();
    }

    public String getClientIP(HttpServletRequest request) {
        String[] headers = {
                "X-Forwarded-For",
                "Proxy-Client-IP",
                "WL-Proxy-Client-IP",
                "HTTP_X_FORWARDED_FOR",
                "HTTP_X_FORWARDED",
                "HTTP_X_CLUSTER_CLIENT_IP",
                "HTTP_CLIENT_IP",
                "HTTP_FORWARDED_FOR",
                "HTTP_FORWARDED",
                "X-Real-IP",
                "X-Cluster-Client-IP"
        };

        for (String header : headers) {
            String ip = request.getHeader(header);
            if (ip != null && !ip.isEmpty() && !"unknown".equalsIgnoreCase(ip)) {
                return ip.split(",")[0].trim();
            }
        }

        return request.getRemoteAddr();
    }

    public void sendPasswordResetVerificationCode(PasswordResetRequest pswResetReq) {
        if (pswResetReq == null) {
            throw new InvalidParameterException("Password reset request not provided");
        }
        if (pswResetReq.getEmail() == null || pswResetReq.getEmail().isEmpty()) {
            throw new InvalidParameterException("Email cannot be null or empty");
        }
        if (pswResetReq.getCode() == null || pswResetReq.getCode().isEmpty()) {
            throw new InvalidParameterException("Code cannot be null or empty");
        }

        // TODO: send email
        Notification notif = Notification.builder()
                .title("Password Reset Verification Code")
                .user(pswResetReq.getUser())
                .notificationCategory(NotificationCategory.DEFAULT)
                .content("Your password reset verification code is: " + pswResetReq.getCode())
                .read(false)
                .partialUrl("/reset-password?code=" + pswResetReq.getCode() + "&email=" + pswResetReq.getEmail()) // TODO: change this to the actual reset password URL
                .build();
        emailNotificationSender.sendNotification(notif);

        log.info("Sending password reset verification code {} to email {}", pswResetReq.getCode(), pswResetReq.getEmail());
    }

    public UserStatsDTO getRegisteredUserCount(@NotNull User currentUser){
        if (currentUser.getRole().getName() != UserRoleEnum.ADMIN && currentUser.getRole().getName() != UserRoleEnum.SUPER_ADMIN) {
            throw new PermissionDeniedException("You don't have permission to access this resource");
        }

        List<UserRepository.RoleUserCount> counts = userRepository.countUsersByRole();
        UserStatsDTO.UserStatsDTOBuilder builder = UserStatsDTO.builder();
        long total = 0;
        for (UserRepository.RoleUserCount c : counts) {
            total += c.getUserCount();
            switch (c.getRoleName()) {
                case "SELLER" -> builder.sellers(c.getUserCount());
                case "BIDDER" -> builder.bidders(c.getUserCount());
                case "ADMIN" -> builder.admins(c.getUserCount());
            }
        }
        builder.totalUsers(total);
        return builder.build();
    }

    public boolean verifyPasswordResetCode(String email, String code) throws LimitExceededException {
        if (email == null || email.isEmpty()) {
            throw new InvalidParameterException("Email cannot be null or empty");
        }
        if (code == null || code.isEmpty()) {
            throw new InvalidParameterException("Code cannot be null or empty");
        }
        // check if the reset code is valid and not expired
        PasswordResetRequest resetRequest = passwordResetRequestRepository.findTopByExpiresAtAfterAndEmailAndCodeAndIsUsedFalseOrderByCreatedAtDesc(Instant.now(), email, code);
        if (resetRequest == null) {
            log.warn("Invalid or expired reset code for email: {}", email);
            return false;
        }
        if(resetRequest.getCodeChecks()>5){
            throw new LimitExceededException("Too many attempts to verify reset code for email: " + email);
        }
        log.info("Valid reset code for email: {}", email);
        return true;
    }
}
