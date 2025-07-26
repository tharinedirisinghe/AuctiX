package com.helios.auctix.controllers;

import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.dtos.LoginRequestDTO;
import com.helios.auctix.dtos.RegistrationRequestDTO;
import com.helios.auctix.events.notification.NotificationEventPublisher;
import com.helios.auctix.repositories.UserRepository;
import com.helios.auctix.services.UserAuthenticationService;
import com.helios.auctix.services.user.UserDetailsService;
import com.helios.auctix.services.user.UserRegisterService;
import com.helios.auctix.services.user.UserServiceResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RequestMapping("/api/auth")
@RestController
public class UserAuthController {

    private final UserRegisterService userRegisterService;
    private final UserDetailsService userDetailsService;
    private UserAuthenticationService userAuthenticationService;
    private final NotificationEventPublisher notificationEventPublisher;
    private UserRepository userRepository; // TODO Replace with UserService when it is implemented

    public UserAuthController(UserAuthenticationService userAuthenticationService, UserRepository userRepository, UserRegisterService userRegisterService, UserDetailsService userDetailsService, NotificationEventPublisher notificationEventPublisher) {
        this.userAuthenticationService = userAuthenticationService;
        this.userRepository = userRepository;
        this.userRegisterService = userRegisterService;
        this.userDetailsService = userDetailsService;
        this.notificationEventPublisher = notificationEventPublisher;
    }

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegistrationRequestDTO registrationRequestDTO) {

        if (registrationRequestDTO == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Invalid request");
        }

        User currentUser = null;
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            currentUser = userDetailsService.getAuthenticatedUser(authentication);
        }
        catch(Exception e){
            log.warn("only admins and supper admins can create admins");
        }

        // TODO use UserService check if user already exists

        UserServiceResponse registrationResponse = userRegisterService.addUser(
                registrationRequestDTO.getUsername(),
                registrationRequestDTO.getEmail(),
                registrationRequestDTO.getPassword(),
                registrationRequestDTO.getFirstName(),
                registrationRequestDTO.getLastName(),
                UserRoleEnum.valueOf(registrationRequestDTO.getRole()),
                currentUser
        );

        if (!registrationResponse.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(registrationResponse.getMessage());
        }

        notificationEventPublisher.publishNotificationEvent(
                "Welcome to AuctiX",
                "Your account on the AuctiX platform has been created successfully!",
                NotificationCategory.WELCOME_MESSAGE,
                registrationResponse.getUser(), // Use the newly created user, not currentUser
                null
        );

        // send a jwt to log the user in when registration is successful
        return ResponseEntity.status(HttpStatus.CREATED).body(
                userAuthenticationService.verify(registrationResponse.getUser(), registrationRequestDTO.getPassword()));

    }

    @PostMapping("/login")
    public ResponseEntity<String> login(@RequestBody LoginRequestDTO loginRequestDTO) {

        try {
            if (loginRequestDTO == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Authentication Request is invalid");
            }

            User user = userRepository.findByEmail(loginRequestDTO.getEmail());

            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email or password is incorrect");
            }

            String jwt = userAuthenticationService.verify(user, loginRequestDTO.getPassword());

            if (jwt == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email or password is incorrect");
            }

            return ResponseEntity.ok(jwt);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Email or password is incorrect");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Internal Server Error");
        }


    }
}
