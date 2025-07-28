package com.helios.auctix.controllers;

import com.helios.auctix.domain.user.*;
import com.helios.auctix.dtos.AdminActionDTO;
import com.helios.auctix.repositories.UserRepository;
import com.helios.auctix.services.AuctionSchedulerService;
import com.helios.auctix.services.user.AdminActionService;
import com.helios.auctix.services.user.UserDetailsService;
import com.helios.auctix.services.user.UserServiceResponse;
import com.helios.auctix.services.user.UserUploadsService;
import jakarta.validation.constraints.Null;
import org.apache.tomcat.websocket.AuthenticationException;
import org.checkerframework.checker.units.qual.A;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AuctionSchedulerService auctionSchedulerService;
    private final UserDetailsService userDetailsService;
    private static final Logger logger = Logger.getLogger(AdminController.class.getName());
    private final UserUploadsService userUploadsService;
    private final AdminActionService adminActionService;
    private final UserRepository userRepository;

    @Autowired
    public AdminController(AuctionSchedulerService auctionSchedulerService, UserDetailsService userDetailsService, UserUploadsService userUploadsService, AdminActionService adminActionService, UserRepository userRepository) {
        this.auctionSchedulerService = auctionSchedulerService;
        this.userDetailsService = userDetailsService;
        this.userUploadsService = userUploadsService;
        this.adminActionService = adminActionService;
        this.userRepository = userRepository;
    }

    /**
     * Admin endpoint to manually complete an auction
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @PostMapping("/auctions/{auctionId}/complete")
    public ResponseEntity<?> completeAuction(@PathVariable UUID auctionId) {
        try {
            // Get the current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userDetailsService.getAuthenticatedUser(authentication);

            logger.info("Admin " + currentUser.getUsername() + " is manually completing auction: " + auctionId);

            auctionSchedulerService.manuallyCompleteAuction(auctionId);

            return ResponseEntity.ok().body("Auction completed successfully");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            logger.severe("Error completing auction: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error completing auction: " + e.getMessage());
        }
    }

    /**
     * Admin endpoint to trigger the auction completion process for all eligible auctions
     */
    @PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
    @PostMapping("/auctions/process-completed")
    public ResponseEntity<?> processCompletedAuctions() {
        try {
            // Get the current authenticated user
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            User currentUser = userDetailsService.getAuthenticatedUser(authentication);

            logger.info("Admin " + currentUser.getUsername() + " is manually processing completed auctions");

            auctionSchedulerService.processCompletedAuctions();

            return ResponseEntity.ok().body("Completed auctions processed successfully");
        } catch (Exception e) {
            logger.severe("Error processing completed auctions: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error processing completed auctions: " + e.getMessage());
        }
    }

    @DeleteMapping("/deleteUserProfilePhoto")
    public ResponseEntity<String> deleteUserProfilePhoto(@RequestParam("username") String username) throws AuthenticationException {

        // Authenticate user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);
        logger.info("File upload by user " + currentUser.getEmail());

        if(!(currentUser.getRoleEnum().equals(UserRoleEnum.ADMIN) || currentUser.getRoleEnum().equals(UserRoleEnum.SUPER_ADMIN))) {
            throw new AuthenticationException("Invalid role");
        }

        User targetUser = userRepository.findByUsername(username);
        if(targetUser == null) {
            return ResponseEntity.badRequest().body("Username is required");
        }
        UserServiceResponse res = userUploadsService.UserProfilePhotoDelete(targetUser);
        if (res.isSuccess()) {
            adminActionService.logAdminAction(currentUser,targetUser, AdminActionsEnum.USER_PROFILE_PHOTO_REMOVE, "Admin deleted profile photo for user: " + targetUser.getUsername());
            return ResponseEntity.ok().body("Profile photo deleted successfully");
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(res.getMessage());
        }

    }

    @GetMapping("/getAdminActionsLog")
    public ResponseEntity<?> getAdminActionsLog() throws AuthenticationException {
        // Get the current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        logger.info("Retrieving admin actions log");
        if (!currentUser.getRoleEnum().equals(UserRoleEnum.SUPER_ADMIN)) {
            throw new AuthenticationException("Invalid role");
        }
        List<AdminAction> actions = adminActionService.findAllByUser(currentUser);
        return ResponseEntity.ok(actions);
    }

    @GetMapping("/getFilteredAdminActionsLog")
    public ResponseEntity<Page<AdminActionDTO>> getFilteredAdminActionsLog(
            @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit,
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "actionTypeFilter", required = false, defaultValue = "") String actionTypeFilter,
            @RequestParam(value = "order", required = false, defaultValue = "asc") String order
    ) throws AuthenticationException {
        // Get the current authenticated user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        logger.info("Retrieving filtered admin actions log");
        if (!currentUser.getRoleEnum().equals(UserRoleEnum.SUPER_ADMIN)) {
            throw new AuthenticationException("Invalid role");
        }
        Page<AdminActionDTO> pageData = adminActionService.getAllAdminActions(limit, offset, search, actionTypeFilter, order);
        return ResponseEntity.ok(pageData);
    }

    @PostMapping("/banUser")
    public ResponseEntity<String> banUser(
            @RequestParam("username") String targetUserUsername,
            @RequestParam("reason") String reason
    ) throws AuthenticationException {
        // Authenticate user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);
        logger.info("Ban request by user " + currentUser.getEmail()+" for user "+targetUserUsername);


        if (reason == null || reason.isEmpty()) {
            throw new IllegalArgumentException("Reason for banning the user is required");
        }

        if(targetUserUsername==null || targetUserUsername.isEmpty()) {
            throw new IllegalArgumentException("Username is the same");
        }

        adminActionService.banUser(targetUserUsername, currentUser, reason, SuspentionDurationEnum.ONE_MONTH); // TODO: give the control to the admin to choose the duration
        return ResponseEntity.ok().body("User banned successfully");

    }


}