package com.helios.auctix.dtos;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@AllArgsConstructor
@NoArgsConstructor
@Data
public class SellerDTO {
//    @JsonIgnore
    private UUID sellerId;
    private Boolean isVerified;
    private Boolean isActive;
    private UUID bannerId;
}
