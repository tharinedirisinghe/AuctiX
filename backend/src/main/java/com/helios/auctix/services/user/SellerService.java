package com.helios.auctix.services.user;

import com.helios.auctix.domain.user.*;
import com.helios.auctix.dtos.SellerVerificationRequestSummaryDTO;
import com.helios.auctix.dtos.VerificationStatusDTO;
import com.helios.auctix.exception.InvalidUserException;
import com.helios.auctix.exception.UploadedFileCountMaxLimitExceedException;
import com.helios.auctix.exception.UploadedFileSizeMaxLimitExceedException;
import com.helios.auctix.mappers.impl.VerificationStatusMapperImpl;
import com.helios.auctix.repositories.SellerRepository;
import com.helios.auctix.repositories.SellerVerificationRequestRepository;
import com.helios.auctix.services.fileUpload.*;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.websocket.AuthenticationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerRepository sellerRepository;
    private final SellerVerificationRequestRepository sellerVerificationRequestRepository;
    private final FileUploadService fileUploadService;
    private final VerificationStatusMapperImpl verificationStatusMapperImpl;

    public SellerVerificationStatusEnum submitSellerVerifications(User user, MultipartFile[] files) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        Seller seller = user.getSeller();
        if (seller == null) {
            throw new IllegalArgumentException("Seller cannot be null");
        }

        // upload Files
        // validate file count
        if(files.length == 0 || files.length >5){
            throw new UploadedFileCountMaxLimitExceedException("Uploaded file count is too large. submit less than 6 documents");
        }

        // validate file size
        for (MultipartFile file : files) {
            int filesize = (int)file.getSize()/(1024*1024);
            if (filesize > 5) {
                throw new UploadedFileSizeMaxLimitExceedException("file size is greater than 5MB");
            }
        }

        // upload files
        List<SellerVerificationRequest> submitedReqs = new ArrayList<>();
        for (MultipartFile file : files) {
            FileUploadResponse res = fileUploadService.uploadFile(file, FileUploadUseCaseEnum.VERIFICATION_DOCUMENT, seller.getId(), false);
            if(!res.isSuccess()){
                throw new RuntimeException("Upload failed");
            }

            SellerVerificationRequest sellerVerificationRequest = SellerVerificationRequest.builder()
                    .seller(seller)
                    .description("no review notes")
                    .verificationStatus(SellerVerificationStatusEnum.PENDING)
                    .document(res.getUpload())
                    .build();

            submitedReqs.add(sellerVerificationRequest);

        }

        sellerVerificationRequestRepository.saveAll(submitedReqs);


//            SellerVerificationRequest verifyRequest = sellerVerificationRequestRepository.findById(UUID.fromString("5acdb56d-4269-4414-9ebe-8ea39a4af9a5")).orElse(null);

//        SellerVerificationDocs docs = sellerVerificationDocsRepository.findById(UUID.fromString("2d9ff3b0-4f4e-40f7-b8fb-4c4c09dde8df"));

//        log.info("seller verification Status: {}",seller.toString());

        return SellerVerificationStatusEnum.NO_VERIFICATION_REQUESTED;

    }

    public VerificationStatusDTO sellerVerifiedStatus(User currentUser) {

        if (currentUser == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        Seller seller = currentUser.getSeller();
        if (seller == null) {
            throw new IllegalArgumentException("Seller cannot be null");
        }

        SellerVerificationStatusEnum status = SellerVerificationStatusEnum.NO_VERIFICATION_REQUESTED;
        List<SellerVerificationRequest> requests = sellerVerificationRequestRepository.findAllBySellerId(seller.getId());

        return verificationStatusMapperImpl.mapTo(requests);
    }

    public List<SellerVerificationRequest> getSellerVerificationRequests(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User cannot be null");
        }
        Seller seller = user.getSeller();
        if (seller == null) {
            throw new IllegalArgumentException("Seller cannot be null");
        }

        return sellerVerificationRequestRepository.findAllBySellerId(seller.getId());
    }

    public Page<SellerVerificationRequestSummaryDTO> getSellerVerificationSummary(
            @NotNull String search,
            String filterBy,
            String filterValue,
            int page,
            int size,
            String sortBy,
            String sortDirection
    ) {
        if( sortBy == null || sortBy.isEmpty() ) {
            sortBy = "createdAt";
            sortDirection = "desc";
        }
        Map<String, String> SORT_FIELD_MAPPINGS = Map.of(
                "submittedAt", "createdAt",
                "verificationStatus", "isApproved",
                "sellerFirstName", "u.firstName",
                "sellerLastName", "u.lastName",
                "email", "u.email",
                "username", "u.username",
                "documentsSubmitted", "pendingCount"
        );

        if(SORT_FIELD_MAPPINGS.containsKey(sortBy)){
            sortBy = SORT_FIELD_MAPPINGS.get(sortBy);
        } else {
            throw new IllegalArgumentException("Invalid sortBy value: " + sortBy);
        }

        Map<String,String> FILTER_FIELD_MAPPINGS = Map.of(
                "verificationStatus", "r.verificationStatus"
        );

        // validate filterBy and filterValue
        // sample values filterBy=[%22verificationStatus%22]
        // filterValue=[[%22PENDING%22,%22APPROVED%22]]


        if(filterBy != null && !filterBy.isEmpty() && !FILTER_FIELD_MAPPINGS.containsKey(filterBy)){
            throw new IllegalArgumentException("Invalid filterBy value: " + filterBy);
        }

        Pageable pageable = PageRequest.of(page, size,
                sortDirection.equalsIgnoreCase("desc") ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending());

        SellerVerificationStatusEnum status = null;
        if ( filterBy != null && !filterBy.isEmpty() ) {
            switch (filterBy){
                case "verificationStatus" -> {
                    if (filterValue != null && !filterValue.isEmpty()) {
                        status = SellerVerificationStatusEnum.fromString(filterValue);
                    }
                }
                default -> {
                    throw new IllegalArgumentException("Invalid filterBy value: " + filterBy);
                }

            }
        }
        else{
            filterBy = null;
            filterValue = null;
        }

        if (search == null || search.isEmpty()) {
            search = "";
        }

        return sellerVerificationRequestRepository.searchAndFilter(search, status , pageable);

    }
}
