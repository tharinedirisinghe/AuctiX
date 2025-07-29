package com.helios.auctix.mappers.impl;

import com.google.monitoring.v3.NotificationChannel;
import com.helios.auctix.domain.user.SellerVerificationRequest;
import com.helios.auctix.domain.user.SellerVerificationStatusEnum;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.dtos.SellerVerificationRequestSummaryDTO;
import com.helios.auctix.dtos.UserDTO;
import com.helios.auctix.dtos.VerificationRequestDTO;
import com.helios.auctix.dtos.VerificationStatusDTO;
import com.helios.auctix.mappers.Mapper;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@AllArgsConstructor
@Component
public class VerificationStatusMapperImpl implements Mapper<List<SellerVerificationRequest>, VerificationStatusDTO> {

    @Override
    public VerificationStatusDTO mapTo(List<SellerVerificationRequest> requests) {
        SellerVerificationStatusEnum status = SellerVerificationStatusEnum.NO_VERIFICATION_REQUESTED;
        if (requests == null || requests.isEmpty()) {
            return new VerificationStatusDTO(status,null);
        }

        VerificationRequestMapperImpl mapper = new VerificationRequestMapperImpl();
        List<VerificationRequestDTO> dtos = new ArrayList<>();
        for (var request:requests) {
            if (request.getVerificationStatus().ordinal() == SellerVerificationStatusEnum.APPROVED.ordinal() && status.ordinal() < request.getVerificationStatus().ordinal()) {
                status = SellerVerificationStatusEnum.APPROVED;
            } else if (request.getVerificationStatus().ordinal() == SellerVerificationStatusEnum.PENDING.ordinal() && status.ordinal() < request.getVerificationStatus().ordinal()) {
                status = SellerVerificationStatusEnum.PENDING;
            } else if (request.getVerificationStatus().ordinal() == SellerVerificationStatusEnum.REJECTED.ordinal() && status.ordinal() < request.getVerificationStatus().ordinal()) {
                status = SellerVerificationStatusEnum.REJECTED;
            }
            VerificationRequestDTO dto = mapper.mapTo(request);
            dtos.add(dto);
        }

        VerificationStatusDTO dto = new VerificationStatusDTO(status,dtos);

        return dto;
    }

    @Override
    public List<SellerVerificationRequest> mapFrom(VerificationStatusDTO dto) {
        throw new UnsupportedOperationException("Mapping from VerificationStatusDTO to List<SellerVerificationRequest> is not supported.");
    }

}
