package com.helios.auctix.services.user;


import com.helios.auctix.config.SupperAdminConfig;
import com.helios.auctix.domain.user.*;
import com.helios.auctix.domain.user.UserRequiredActionEnum;
import com.helios.auctix.repositories.*;
import com.helios.auctix.services.JwtService;
import com.helios.auctix.services.CoinTransactionService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.source.InvalidConfigurationPropertyValueException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@AllArgsConstructor
@Slf4j
public class UserRegisterService {

    private final UserRepository userRepository;
    private final SellerRepository sellerRepository;
    private final BidderRepository bidderRepository;
    private final AdminRepository adminRepository;
    private final UserRoleRepository userRoleRepository;
    private final JwtService jwtService;
    private final SupperAdminConfig supperAdminConfig;
    private final PasswordEncoder encoder;
    private final UserDetailsService userDetailsService;
    private final CoinTransactionService coinTransactionService;


    /**
     * Checks if a user exists in the system based on the provided username.
     *
     * @param username the username to check for existence
     * @return {@code true} if a user with the given username exists, {@code false} otherwise
     */
    public boolean isUserExistsOnUsername(String username) {
        return userRepository.existsByUsername(username);
    }


    /**
     * Checks if a user exists in the system with the given email address.
     *
     * @param email the email address to check for existence
     * @return {@code true} if a user with the specified email exists, {@code false} otherwise
     */
    public boolean isUserExistsOnEmail(String email){
        return userRepository.existsByEmail(email);
    }


    /**
     * Checks if a user exists in the repository by their unique identifier (UUID).
     *
     * @param Id the unique identifier (UUID) of the user to check.
     * @return {@code true} if a user with the specified UUID exists, {@code false} otherwise.
     */
    public boolean isUserExistsOnId(UUID Id){
        return userRepository.existsById(Id);
    }


    /**
     * Registers a new user in the system with the specified details.
     *
     * @param username   The username of the new user.
     * @param email      The email address of the new user.
     * @param rawPassword The raw password of the new user, which will be hashed before saving.
     * @param firstname  The first name of the new user.
     * @param lastname   The last name of the new user.
     * @param role       The role of the new user (SELLER, BIDDER, or ADMIN).
     * @param currentUser The currentUser who made this request to create a user. to create admin account this is required.
     * @return A {@link UserServiceResponse} object containing the success status, message, 
     *         and the created {@link User} object if successful.
     * 
     * This method performs the following steps:
     * <ul>
     *   <li>Checks if a user with the given email or username already exists.</li>
     *   <li>Hashes the provided password.</li>
     *   <li>Creates and saves a new {@link User} object.</li>
     *   <li>Based on the role, creates and saves a corresponding {@link Seller}, {@link Bidder}, 
     *       or {@link Admin} object.</li>
     *   <li>Logs the process at each step for traceability.</li>
     * </ul>
     * If the role is invalid, returns a failure response.
     */
    @Transactional
    public UserServiceResponse addUser(String username, String email, String rawPassword , String firstname, String lastname , UserRoleEnum role, User currentUser) {
        log.info("Creating account " + username);

        // check the userRole is valied
        UserRole userRoleId = userRoleRepository.findByName(role);
        if(userRoleId == null) {
            return new UserServiceResponse(false,"invalied value for user role.");
        }

        // check the email is unique
        if(userRepository.existsByEmail(email)){
            log.error("User already exists from the given email");
            return new UserServiceResponse(false, "User already exists for the given email",null);
        }
        // check the username is unique
        if(userRepository.existsByUsername(username)){
            log.error("User already exists from the given username");
            return new UserServiceResponse(false, "User already exists for the given username",null);
        }

        // check the required permissions to create admin account
        if(role == UserRoleEnum.ADMIN && currentUser.getRole().getName() != UserRoleEnum.SUPER_ADMIN){
            return new UserServiceResponse(false, "You are not allowed to add an admin account.");
        }

        // hash the password
        String hashedPassword = encoder.encode(rawPassword);

        // create and save user data
        log.info("Creating user object");
        User user = User.builder()
                .username(username)
                .email(email)
                .passwordHash(hashedPassword)
                .firstName(firstname)
                .lastName(lastname)
                .role(userRoleId)
                .build();

        log.info("Saving user object");
        user = userRepository.save(user);

        if(UserRoleEnum.SELLER == role) {
        // save default seller data
            log.info("Creating seller object with id " + user.getId());
            Seller seller = Seller.builder()
                    .user(user)
                    .isVerified(false)
                    .isActive(true)
                    .build();
            log.info("Saving seller object");
            sellerRepository.save(seller);
            log.info("User and Seller saved successfully");

            // Register required action for seller
            userDetailsService.registerUserRequiredAction(user, UserRequiredActionEnum.COMPLETE_PROFILE);
            log.info("Required action for seller registered successfully");

            // Create wallet for seller
            createWalletForUser(user);
        }
        else if(UserRoleEnum.BIDDER == role) {
        // save bidder data
            log.info("Creating bidder object with id " + user.getId());
            Bidder bidder = Bidder.builder()
                    .user(user)
                    .isActive(true)
                    .build();

            log.info("Saving bidder object");
            bidderRepository.save(bidder);
            log.info("User and Bidder saved successfully");

            // Register required action for bidder
            userDetailsService.registerUserRequiredAction(user, UserRequiredActionEnum.COMPLETE_PROFILE);
            log.info("Required action for bidder registered successfully");

            // Create wallet for bidder
            createWalletForUser(user);
        }
        else if(UserRoleEnum.ADMIN == role) {
        // save admin data
            log.info("Creating admin object with id " + user.getId());
            Admin admin = Admin.builder()
                    .user(user)
                    .isActive(true)
                    .build();
            log.info("Saving admin object");
            adminRepository.save(admin);
            log.info("User and Admin saved successfully");

            // Register required action for admin
            userDetailsService.registerUserRequiredAction(user, UserRequiredActionEnum.FIRST_LOGIN_CHANGE_PASSWORD);
            log.info("Required action for admin registered successfully");
        }
        else{
            log.error("Invalid role");
            return new UserServiceResponse(false, "Invalid role",null);
        }
        return new UserServiceResponse(true, "User registered successfully",user);
    }

    public boolean registerSupperAdmin() throws InvalidConfigurationPropertyValueException {
            log.info("registering supper admin account");
            UserRole userRoleId = userRoleRepository.findByName(UserRoleEnum.SUPER_ADMIN);
            String hashedPassword = encoder.encode(supperAdminConfig.getPassword());

            User userWithUsername = userRepository.findByUsername(supperAdminConfig.getUsername());
            User userWithEmail = userRepository.findByEmail(supperAdminConfig.getEmail());
//            log.info(userWithUsername.getId().toString()+" "+userWithEmail.getId().toString());

            if( userWithEmail!=null || userWithUsername!=null ) {
                if(userWithEmail!=null && userWithUsername!=null && userWithUsername.getId().equals(userWithEmail.getId())) {
                    // both username and emails are used in same account
                    if( userWithEmail.getRoleEnum()==UserRoleEnum.SUPER_ADMIN){
                        // The account is previous supper admin account
                        log.info("username or email already exists. deleting previous super admin");
                        userRepository.delete(userWithEmail);
                    }
                    else{
                        // normal account use one of username or email
                        throw new InvalidConfigurationPropertyValueException("Error in super admin config", supperAdminConfig, "super admin username and email is already used in a user account");
                    }
                }
                else {
                    // only username or email is in use
                    throw new InvalidConfigurationPropertyValueException("Error in super admin configs", supperAdminConfig, "super admin username or email is already used in other accounts.");
                }
            }

        try {
            User user = User.builder()
                    .username(supperAdminConfig.getUsername())
                    .email(supperAdminConfig.getEmail())
                    .passwordHash(hashedPassword)
                    .firstName("Supper")
                    .lastName("Admin")
                    .role(userRoleId)
                    .build();

            log.info("Saving supper admin account");
            user = userRepository.save(user);

            return true;
        }
        catch(Exception e){
            log.error("supper admin registering failed "+ e.getMessage());
            return false;
        }
    }

    // TODO refactor later to a seperate service
    public User getUser(UUID userId) {
        return userRepository.findById(userId).orElse(null);
    }

    public User getUserFromToken(String token) {
        String email = jwtService.extractEmail(token);
        return userRepository.findByEmail(email);
    }

    public User getUserFromEmail(String email) {
        return userRepository.findByEmail(email);
    }

    /**
     * Creates a wallet for the given user automatically during registration
     * 
     * @param user The user for whom to create the wallet
     */
    private void createWalletForUser(User user) {
        try {
            log.info("Creating wallet for user: " + user.getId());
            coinTransactionService.createWalletForUser(user.getId());
            log.info("Wallet created successfully for user: " + user.getId());
        } catch (Exception e) {
            log.error("Failed to create wallet for user " + user.getId() + ": " + e.getMessage());
            // Don't fail the registration if wallet creation fails
            // The user can manually create wallet later if needed
        }
    }


}

