package com.helios.auctix.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerPublicProfileDTO {
    private UUID id;
    private String username;
    private String firstName;
    private String lastName;
    private String bio;
    private List<String> links;
    private String profilePictureId;
    private String bannerId;
    private boolean isVerified;

}
