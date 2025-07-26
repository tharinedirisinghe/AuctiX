package com.helios.auctix.controllers;

import com.azure.core.util.BinaryData;
import com.helios.auctix.domain.user.PasswordResetRequest;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRequiredAction;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.dtos.ProfileUpdateDataDTO;
import com.helios.auctix.dtos.UserDTO;
import com.helios.auctix.dtos.UserStatsDTO;
import com.helios.auctix.exception.PermissionDeniedException;
import com.helios.auctix.exception.UploadedFileCountMaxLimitExceedException;
import com.helios.auctix.exception.UploadedFileSizeMaxLimitExceedException;
import com.helios.auctix.mappers.impl.UserMapperImpl;
import com.helios.auctix.services.fileUpload.*;
import com.helios.auctix.services.user.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.AllArgsConstructor;
import org.apache.tomcat.websocket.AuthenticationException;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.PermissionDeniedDataAccessException;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.naming.LimitExceededException;
import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.logging.Logger;

@RestController
@RequestMapping("api/user")
@AllArgsConstructor
public class UserController {

    private final UserRegisterService userRegisterService;
    private final Logger log = Logger.getLogger(UserController.class.getName());
    private final FileUploadService uploader;
    private final UserUploadsService userUploadsService;
    private final FileUploadService fileUploadService;
    private final UserDetailsService userDetailsService;
    private final UserMapperImpl userMapper;
    private final UserMapperImpl userMapperImpl;

    @Profile("dev")
    @GetMapping("/hello")
    public String hello() {
        return "hello world!";
    }

    @GetMapping("/isUserExists")
    public String isUserExcist(@RequestParam(required = false) String username, @RequestParam(required = false) UUID id, @RequestParam(required = false) String email) {
        boolean hasUname = !(username == null || username.isBlank());
        boolean hasId = id != null;
        boolean hasEmail = !(email == null || email.isBlank());
        byte providedParamsCount = 0;
        if (hasUname) {
            providedParamsCount++;
        }
        if (hasId) {
            providedParamsCount++;
        }
        if (hasEmail) {
            providedParamsCount++;
        }
        if (providedParamsCount != 1) {
            return "Error: must provide only one of username/id or email";
        } else {
            boolean userExists = false;
            if (hasEmail) {
                userExists = userRegisterService.isUserExistsOnEmail(email);
            } else if (hasUname) {
                userExists = userRegisterService.isUserExistsOnUsername(username);
            } else if (hasId) {
                userExists = userRegisterService.isUserExistsOnId(id);
            }
            return String.valueOf(userExists);
        }
    }

    @PostMapping("/uploadVerificationDocs")
    public ResponseEntity<String> uploadVerificationDocs(@RequestParam("files") MultipartFile[] files) throws AuthenticationException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        // validate file count
        if(files.length == 0 || files.length >5){
            throw new UploadedFileCountMaxLimitExceedException("Uploaded file count is too large. submit less than 6 documents");
        }

        // validate file size
        for (MultipartFile file : files) {
            int filesize = (int)file.getSize()/(1024*1024);
            if (filesize > 5) {
                throw new UploadedFileSizeMaxLimitExceedException("file size is greater than 5MB");
            }
        }

        // upload files
        for (MultipartFile file : files) {
            FileUploadResponse res = uploader.uploadFile(file, FileUploadUseCaseEnum.VERIFICATION_DOCUMENT, currentUser.getId(), false);
            if(!res.isSuccess()){
                throw new RuntimeException("Upload failed");
            }
        }
        return ResponseEntity.ok("upload completed");
    }

    @Profile("dev")
    @PostMapping("/createSeller")
    public ResponseEntity<String> createUser(@RequestParam("username") String username, @RequestParam("email") String email, @RequestParam("password") String password, @RequestParam("firstName") String firstName, @RequestParam("lastName") String lastName) {
        log.info("Seller creation request: " + username);
        UserServiceResponse res = userRegisterService.addUser(username, email, password, firstName, lastName, UserRoleEnum.SELLER, null);
        if (res.isSuccess()) {
            return ResponseEntity.ok("Success: Seller Created");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(res.getMessage());
        }
    }

    @Profile("dev")
    @PostMapping("/createBidder")
    public String createBidder(@RequestParam("username") String username, @RequestParam("email") String email, @RequestParam("password") String password, @RequestParam("firstName") String firstName, @RequestParam("lastName") String lastName) {
        log.info("Bidder creation request: " + username);
        UserServiceResponse res = userRegisterService.addUser(username, email, password, firstName, lastName, UserRoleEnum.BIDDER, null);
        if (res.isSuccess()) {
            return "Success: Bidder Created";
        } else {
            return res.getMessage();
        }
    }

    @PostMapping("/createAdmin")
    public ResponseEntity<String> createAdmin(@RequestParam("username") String username, @RequestParam("email") String email, @RequestParam("password") String password, @RequestParam("firstName") String firstName, @RequestParam("lastName") String lastName) throws AuthenticationException {
        log.info("Admin creation request: " + username);
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        UserServiceResponse res = userRegisterService.addUser(username, email, password, firstName, lastName, UserRoleEnum.ADMIN, currentUser);
        if (res.isSuccess()) {
            return ResponseEntity.ok("Success: Admin Created");
        } else {
            return ResponseEntity.badRequest().body(res.getMessage());
        }
    }

    @Profile("dev")
    @GetMapping("/getAuthUser")
    public ResponseEntity<?> getUser() throws AuthenticationException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);
        return ResponseEntity.ok(currentUser);
    }

    @GetMapping("/getUsers")
    public ResponseEntity<Page<UserDTO>> getUsers(
            @RequestParam(value = "limit", required = false, defaultValue = "10") Integer limit,
            @RequestParam(value = "offset", required = false, defaultValue = "0") Integer offset,
            @RequestParam(value = "sortBy", required = false, defaultValue = "id") String sortBy,
            @RequestParam(value = "order", required = false, defaultValue = "asc") String order,
            @RequestParam(value = "filterBy", required = false, defaultValue = "") String filterBy,
            @RequestParam(value = "filterValue", required = false, defaultValue = "") String filterValue,
            @RequestParam(value = "search", required = false) String search)
            throws AuthenticationException, UnsupportedEncodingException { // TODO: add UnsupportedEncodingException to gloabal exception handler

        // user authentication and authorization
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userDetailsService.getAuthenticatedUser(authentication);
        String userRole = user.getRole().getName().toString();
        log.info("user data requested by " + user.getEmail() + "," + userRole);
        if (!(UserRoleEnum.valueOf(userRole) == UserRoleEnum.ADMIN || UserRoleEnum.valueOf(userRole) == UserRoleEnum.SUPER_ADMIN)) {
            throw new PermissionDeniedException("You don't have permission to access this resource");
        }

        // decode from url encoded parameters
        if (search != null) {
            search = URLDecoder.decode(search, StandardCharsets.UTF_8);
        }
        if (filterBy != null) {
            filterBy = URLDecoder.decode(filterBy, StandardCharsets.UTF_8);
        }
        if (sortBy != null) {
            sortBy = URLDecoder.decode(sortBy, StandardCharsets.UTF_8);
        }
        if (order != null) {
            order = URLDecoder.decode(order, StandardCharsets.UTF_8);
        }
        if (filterValue != null) {
            filterValue = URLDecoder.decode(filterValue, StandardCharsets.UTF_8);
        }

        Page<UserDTO> userPage = userDetailsService.getAllUsers(limit, offset, order, sortBy, search,filterBy,filterValue);
        return ResponseEntity.ok(userPage);
    }


    @GetMapping("/getCurrentUser")
    public ResponseEntity<UserDTO> getCurrentUser() throws AuthenticationException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);
        return ResponseEntity.ok(userMapper.mapTo(currentUser));
    }

    @GetMapping("/getUser")
    public ResponseEntity<?> getUser(
            @RequestParam(value = "username", required = false) String username,
            @RequestParam(value = "email", required = false) String email,
            @RequestParam(value = "userId", required = false) UUID userId
    ) {
        User user = null;
        boolean hasUname = !(username == null || username.isBlank());
        boolean hasId = userId != null;
        boolean hasEmail = !(email == null || email.isBlank());
        byte providedParamsCount = 0;
        if (hasUname) {
            providedParamsCount++;
        }
        if (hasId) {
            providedParamsCount++;
        }
        if (hasEmail) {
            providedParamsCount++;
        }
        if (providedParamsCount != 1) {
            return ResponseEntity.badRequest().body("Error: must provide only one of username,id or email");
        } else {
            if (hasEmail) {
                user = userDetailsService.getUserByEmail(email);
            } else if (hasUname) {
                user = userDetailsService.getUserByUsername(username);
            } else if (hasId) {
                user = userDetailsService.getUserById(userId);
            }
        }
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        return ResponseEntity.ok(userMapperImpl.mapTo(user));
    }

    @PostMapping("/uploadUserProfilePhoto")
    public ResponseEntity<String> uploadUserProfilePhoto(@RequestParam("file") MultipartFile file) throws AuthenticationException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        log.info("File upload by user " + currentUser.getUsername());

        // Upload file
        log.info("Trying to upload file");
        FileUploadResponse uploadRes = uploader.uploadFile(file, FileUploadUseCaseEnum.PROFILE_PHOTO, currentUser.getEmail(), true);

        if (uploadRes.isSuccess()) {
            // save file upload data
            log.info("Trying to save file upload data");
            UserServiceResponse res = userUploadsService.UserProfilePhotoUpdate(currentUser.getEmail(), uploadRes.getUpload());
            log.info("File upload data saved");

            if (res.isSuccess()) {
                return ResponseEntity.ok().body("Profile photo uploaded successfully " + res.getUser().getUpload().getId());
            } else {
                log.warning(res.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("File upload data saving failed");
            }

        } else {
            log.warning(uploadRes.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("File upload failed");
        }

    }

    @PostMapping("/uploadUserBannerPhoto")
    public ResponseEntity<String> uploadBannerPhoto(@RequestParam("file") MultipartFile file) throws AuthenticationException {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        // only sellers can upload banner photos
        if (currentUser != null && currentUser.getRole().getName() != UserRoleEnum.SELLER) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You don't have permission to upload banner photo");
        }

        log.info("File upload by user " + currentUser.getUsername());

        // Upload file
        log.info("Trying to upload file");
        FileUploadResponse uploadRes = uploader.uploadFile(file, FileUploadUseCaseEnum.PROFILE_BANNER_PHOTO, currentUser.getEmail(), true);

        if (uploadRes.isSuccess()) {
            // save file upload data
            log.info("Trying to save file upload data");
            userUploadsService.UserBannerPhotoUpdate(currentUser.getId(), uploadRes.getUpload());
            log.info("File upload data saved");
            return ResponseEntity.ok().body("Banner photo uploaded successfully " + uploadRes.getUpload().getId());

        } else {
            log.warning(uploadRes.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("File upload failed");
        }
    }


    @GetMapping("/getUserProfilePhoto")
    public ResponseEntity<?> getUserProfilePhoto(@RequestParam("file_uuid") UUID file_uuid) throws AuthenticationException {

        log.info("file get request: " + file_uuid);

        // Authenticate user
        User currentUser = null;
        FileUploadResponse res = null;
        if (!fileUploadService.isFilePublic(file_uuid)) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            currentUser = userDetailsService.getAuthenticatedUser(authentication);
            log.info("getting File by user " + currentUser.getEmail());

            // Get file upload data
            res = fileUploadService.getFile(file_uuid, currentUser.getEmail());
        } else {
            res = fileUploadService.getFile(file_uuid);
        }

        if (!res.isSuccess()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(res.getMessage());
        }

        BinaryData binaryFile = res.getBinaryData();
        String fileName = res.getUpload().getFileName();
        String contentType = res.getUpload().getFileType().getContentType();


        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(binaryFile.toBytes());
    }

    @GetMapping("/getUserBannerPhoto")
    public ResponseEntity<?> getUserBannerPhoto(@RequestParam("file_uuid") UUID file_uuid) throws AuthenticationException {
        log.info("banner file get request: " + file_uuid);

        // Authenticate user
        User currentUser = null;
        FileUploadResponse res = null;
        if (!fileUploadService.isFilePublic(file_uuid)) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            currentUser = userDetailsService.getAuthenticatedUser(authentication);
            log.info("getting banner file by user " + currentUser.getEmail());

            // Get file upload data
            res = fileUploadService.getFile(file_uuid, currentUser.getEmail());
        } else {
            res = fileUploadService.getFile(file_uuid);
        }

        if (!res.isSuccess()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(res.getMessage());
        }

        BinaryData binaryFile = res.getBinaryData();
        String fileName = res.getUpload().getFileName();
        String contentType = res.getUpload().getFileType().getContentType();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(binaryFile.toBytes());
    }

    @DeleteMapping("/deleteUserProfilePhoto")
    public ResponseEntity<String> deleteUserProfilePhoto(@RequestParam("username") String username) throws AuthenticationException {

        // Authenticate user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);
        log.info("File upload by user " + currentUser.getEmail());

        // Delete file
        UserServiceResponse res = userUploadsService.UserProfilePhotoDelete(currentUser);
        if (res.isSuccess()) {
            return ResponseEntity.ok().body("Profile photo deleted successfully");
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(res.getMessage());
        }

    }

    @DeleteMapping("/deleteBannerPhoto")
    public ResponseEntity<String> deleteBannerPhoto() throws AuthenticationException {

        // Authenticate user
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        // only sellers can delete banner photos
        if (currentUser != null && currentUser.getRole().getName() != UserRoleEnum.SELLER) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You don't have permission to delete banner photo");
        }

        // Delete file
        UserServiceResponse res = userUploadsService.UserBannerPhotoDelete(currentUser.getId());
        if (res.isSuccess()) {
            return ResponseEntity.ok().body("Banner photo deleted successfully");
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(res.getMessage());
        }
    }

    @PostMapping("/updateProfile")
    public ResponseEntity<Boolean> updateProfileInfo(@RequestBody ProfileUpdateDataDTO profileUpdateDataDTO) throws AuthenticationException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        // Update user profile
        UserServiceResponse response = userDetailsService.updateUserProfile(currentUser, profileUpdateDataDTO);
        if (response.isSuccess()) {
            return ResponseEntity.ok(true);
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(false);
        }
    }

    @GetMapping("/getUserRequiredActions")
    public ResponseEntity<List<UserRequiredAction>> getUserRequiredActions() throws AuthenticationException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);
        List<UserRequiredAction> requiredActions = userDetailsService.getRequiredActions(currentUser);
        return ResponseEntity.ok(requiredActions);
    }

    @PostMapping("/changePassword")
    public ResponseEntity<String> changePassword(@RequestParam("oldPassword") String oldPassword, @RequestParam("newPassword") String newPassword) throws AuthenticationException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        // Change password
        UserServiceResponse response = userDetailsService.changePassword(currentUser, oldPassword, newPassword);
        if (response.isSuccess()) {
            return ResponseEntity.ok("Password changed successfully");
        }
        else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response.getMessage());
        }
    }

    @PostMapping("/resetPassword")
    public ResponseEntity<String> resetPassword(
            @RequestParam("email") String email,
            @RequestParam("code") String code,
            @RequestParam("newPassword") String newPassword ) throws AuthenticationException{
        // Reset password
        UserServiceResponse response = userDetailsService.resetPassword(email, code, newPassword);
        if (response.isSuccess()) {
            return ResponseEntity.ok("Password reset successfully.");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response.getMessage());
        }
    }

    @PostMapping("/passwordResetVerificationCode")
    public ResponseEntity<String> passwordResetVerificationCode(
            HttpServletRequest request,
            @RequestParam("email") String email) throws LimitExceededException {
        String ipAddress = userDetailsService.getClientIP(request);
        // Generate password reset verification code
        PasswordResetRequest pswResetReq = userDetailsService.generatePasswordResetCode(email, ipAddress);
        userDetailsService.sendPasswordResetVerificationCode(pswResetReq);
        return ResponseEntity.ok("Password reset verification code sent to " + pswResetReq.getEmail());
    }

    @PostMapping("/verifyPasswordResetCode")
    public ResponseEntity<String> verifyPasswordResetCode(
            @RequestParam("email") String email,
            @RequestParam("code") String code) throws AuthenticationException, LimitExceededException {
        // Verify password reset code
        boolean isVerified = userDetailsService.verifyPasswordResetCode(email, code);
        if (isVerified) {
            return ResponseEntity.ok("Password reset code verified successfully.");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid password reset code.");
        }
    }

    @GetMapping("/userStats")
    public ResponseEntity<UserStatsDTO> getRegisteredUserCount() throws AuthenticationException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        UserStatsDTO count = userDetailsService.getRegisteredUserCount(currentUser);
        return ResponseEntity.ok(count);
    }

}