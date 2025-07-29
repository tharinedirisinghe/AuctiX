package com.helios.auctix.mappers.impl;

import com.helios.auctix.domain.upload.FileTypeEnum;
import com.helios.auctix.domain.upload.Upload;
import com.helios.auctix.domain.user.Seller;
import com.helios.auctix.domain.user.SellerVerificationRequest;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.dtos.VerificationRequestDTO;
import com.helios.auctix.mappers.Mapper;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@AllArgsConstructor
@Component
public class VerificationRequestMapperImpl implements Mapper<SellerVerificationRequest, VerificationRequestDTO> {

    @Override
    public VerificationRequestDTO mapTo(SellerVerificationRequest request) {
        if (request == null) {
            return null;
        }
        Seller seller = request.getSeller();
        Upload upload = request.getDocument();

        VerificationRequestDTO dto = new VerificationRequestDTO();
        dto.setStatus(request.getVerificationStatus());
        if(seller != null){
            dto.setSellerUsername(seller.getUser().getUsername());
        }
        if(upload != null) {
            dto.setDocId(upload.getId().toString());
            dto.setDocType(upload.getFileType().toString());
            dto.setDocTitle(upload.getFileName());
            dto.setDocSize(upload.getFileSize());
        }
        dto.setDescription(request.getDescription());
        dto.setCreatedAt(request.getCreatedAt());
        dto.setReviewedAt(request.getReviewedAt());
        dto.setId(request.getId());

        return dto;
    }

    @Override
    public SellerVerificationRequest mapFrom(VerificationRequestDTO dto) {
        if (dto == null) {
            return null;
        }

        log.warn("Mapping VerificationRequestDTO to SellerVerificationRequest is not return full objects of upload and seller, only IDs and basic info are set. Ensure that the full objects are fetched from the database when needed.");

        Upload document = Upload.builder()
                .id(UUID.fromString(dto.getDocId()))
                .fileType(dto.getDocType() != null ? FileTypeEnum.valueOf(dto.getDocType()) : null)
                .fileName(dto.getDocTitle())
                .build();

        Seller seller = Seller.builder()
                .user(
                        User.builder()
                                .username(dto.getSellerUsername())
                                .build()
                )
                .build();

        SellerVerificationRequest request = SellerVerificationRequest.builder()
                .verificationStatus(dto.getStatus())
                .description(dto.getDescription())
                .createdAt(dto.getCreatedAt())
                .reviewedAt(dto.getReviewedAt())
                .document(document)
                .build();

        return request;
    }

}
