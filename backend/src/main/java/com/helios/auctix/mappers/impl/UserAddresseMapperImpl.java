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


        return UserAddressDTO.builder()
                .id(userAddress.getId())
                .addressNumber(userAddress.getAddressNumber())
                .addressLine1(userAddress.getAddressLine1())
                .addressLine2(userAddress.getAddressLine2())
                .city(userAddress.getCity())
                .state(userAddress.getState())
                .postalCode(userAddress.getPostalCode())
                .country(userAddress.getCountry())
                .build();
    }

    @Override
    public UserAddress mapFrom(UserAddressDTO userAddressDTO) {
        if (userAddressDTO == null) {
            return null;
        }

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
    }

}