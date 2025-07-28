package com.helios.auctix.mappers.impl;

import com.helios.auctix.domain.user.UserAddress;
import com.helios.auctix.dtos.UserAddressDTO;
import com.helios.auctix.mappers.Mapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Implementation of Mapper interface for mapping between UserAddress entity and UserAddressDTO.
 * This version adds error handling to prevent crashes if fields don't exist.
 */
@Component
@Slf4j
public class UserAddresseMapperImpl implements Mapper<UserAddress, UserAddressDTO> {

    @Override
    public UserAddressDTO mapTo(UserAddress userAddress) {
        if (userAddress == null) {
            return null;
        }

        try {
            return UserAddressDTO.builder()
                    .id(userAddress.getId())
                    .addressNumber(userAddress.getAddressNumber())
                    .addressLine1(userAddress.getAddressLine1())
                    .addressLine2(userAddress.getAddressLine2())
                    // Use safe getters to prevent NullPointerException
                    .city(getCity(userAddress))
                    .state(getState(userAddress))
                    .postalCode(getPostalCode(userAddress))
                    .country(getCountry(userAddress))
                    .build();
        } catch (Exception e) {
            log.error("Error mapping UserAddress to DTO: {}", e.getMessage());
            // Return a minimal DTO with just the ID to prevent crashes
            return UserAddressDTO.builder()
                    .id(userAddress.getId())
                    .build();
        }
    }

    @Override
    public UserAddress mapFrom(UserAddressDTO userAddressDTO) {
        if (userAddressDTO == null) {
            return null;
        }

        try {
            return UserAddress.builder()
                    .id(userAddressDTO.getId())
                    .addressNumber(userAddressDTO.getAddressNumber())
                    .addressLine1(userAddressDTO.getAddressLine1())
                    .addressLine2(userAddressDTO.getAddressLine2())
                    .city(userAddressDTO.getCity())
                    .state(userAddressDTO.getState())
                    .postalCode(userAddressDTO.getPostalCode())
                    .country(userAddressDTO.getCountry())
                    .build();
        } catch (Exception e) {
            log.error("Error mapping DTO to UserAddress: {}", e.getMessage());
            // Return a minimal entity with just the ID to prevent crashes
            return UserAddress.builder()
                    .id(userAddressDTO.getId())
                    .build();
        }
    }

    // Safe getters to handle potential null/missing fields gracefully
    private String getCity(UserAddress address) {
        try {
            return address.getCity();
        } catch (Exception e) {
            return null;
        }
    }

    private String getState(UserAddress address) {
        try {
            return address.getState();
        } catch (Exception e) {
            return null;
        }
    }

    private String getPostalCode(UserAddress address) {
        try {
            return address.getPostalCode();
        } catch (Exception e) {
            return null;
        }
    }

    private String getCountry(UserAddress address) {
        try {
            return address.getCountry();
        } catch (Exception e) {
            return null;
        }
    }
}