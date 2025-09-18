package com.helios.auctix.services;

import com.helios.auctix.domain.user.User;
import com.helios.auctix.repositories.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User userEntity = userRepository.findByEmail(username);

        if (userEntity == null) {
            throw new UsernameNotFoundException("User not found with email: " + username);
        }

        // Convert the domain User entity to a Spring Security User object
        return new org.springframework.security.core.userdetails.User(
                userEntity.getEmail(),
                userEntity.getPasswordHash(),
                mapRolesToAuthorities(userEntity)
        );
    }

    private Collection<SimpleGrantedAuthority> mapRolesToAuthorities(User userEntity) {
        return Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + userEntity.getRoleEnum())
        );
    }
}
