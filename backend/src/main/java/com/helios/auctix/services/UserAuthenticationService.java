package com.helios.auctix.services;

import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRole;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.repositories.UserRepository;
import com.helios.auctix.repositories.UserRoleRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserAuthenticationService {

    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserRoleRepository roleRepository;
    private final CoinTransactionService coinTransactionService;

    private final CustomUserDetailsService userDetailsService;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public UserAuthenticationService(JwtService jwtService,
                                     AuthenticationManager authenticationManager,
                                     UserRepository userRepository, UserRoleRepository roleRepository, 
                                     CoinTransactionService coinTransactionService, CustomUserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.coinTransactionService = coinTransactionService;
        this.userDetailsService = userDetailsService;
    }

    public User register(String email, String username, String password, UserRoleEnum role) {

        if (role != UserRoleEnum.BIDDER && role != UserRoleEnum.SELLER) {
            throw new IllegalArgumentException("Invalid role");
        }

        UserRole userRole = roleRepository.findByName(role);
        if (userRole == null) {
            throw new IllegalArgumentException("Invalid role");
        }

        User user = User.builder()
                .email(email)
                .username(username)
                .role(userRole)
                .passwordHash(encoder.encode(password))
                .build();

        User savedUser = userRepository.save(user);
        
        // Note: Wallet creation is handled by UserRegisterService for the main registration flow
        // This register method is for direct API usage only
        
        return savedUser;
    }

    public String verify(User user, String rawPasswordFromLogin) throws BadCredentialsException {

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());

        Authentication authentication = authenticationManager
                .authenticate(
                        new UsernamePasswordAuthenticationToken(
                                userDetails.getUsername(),
                                rawPasswordFromLogin,
                                userDetails.getAuthorities()
                        )
                );

        if (authentication.isAuthenticated()) {
            return jwtService.generateToken(user.getEmail(), user.getRoleEnum());
        }
        throw new BadCredentialsException("Invalid username or password");
    }
}