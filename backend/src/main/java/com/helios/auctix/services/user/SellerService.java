package com.helios.auctix.services.user;

import com.helios.auctix.domain.notification.Notification;
import com.helios.auctix.domain.notification.NotificationCategory;
import com.helios.auctix.domain.notification.NotificationCategoryGroup;
import com.helios.auctix.domain.user.*;
import com.helios.auctix.dtos.*;
import com.helios.auctix.exception.InvalidUserException;
import com.helios.auctix.exception.UploadedFileCountMaxLimitExceedException;
import com.helios.auctix.exception.UploadedFileSizeMaxLimitExceedException;
import com.helios.auctix.mappers.impl.VerificationRequestMapperImpl;
import com.helios.auctix.mappers.impl.VerificationStatusMapperImpl;
import com.helios.auctix.repositories.*;
import com.helios.auctix.services.fileUpload.*;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.velocity.exception.ResourceNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerService {

    private final SellerRepository sellerRepository;
    private final SellerVerificationRequestRepository sellerVerificationRequestRepository;
    private final FileUploadService fileUploadService;
    private final VerificationStatusMapperImpl verificationStatusMapperImpl;
    private final UserRepository userRepository;
    private final VerificationRequestMapperImpl verificationRequestMapperImpl;
    private final UserDetailsService userDetailsService;
    private final NotificationRepository notificationRepository;
    private final AdminActionService adminActionService;
    private final UserRequiredActionRepository userRequiredActionRepository;


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

    public List<VerificationRequestDTO> viewSellerVerifications(String sellerUserName) {
        if (sellerUserName == null || sellerUserName.isEmpty()) {
            throw new IllegalArgumentException("Seller username cannot be null or empty");
        }

        User sellerUser = userRepository.findByUsername(sellerUserName);
        if (sellerUser == null) {
            throw new InvalidUserException("Seller user not found with username: " + sellerUserName);
        }

        Seller seller = sellerUser.getSeller();
        if (seller == null) {
            throw new InvalidUserException("Seller not found for user: " + sellerUserName);
        }

        List<SellerVerificationRequest> verificationRequests = seller.getSellerVerificationRequests();
         return verificationRequests.stream()
         .map(verificationRequestMapperImpl::mapTo)
         .toList();
    }

    public SellerVerificationStatsDTO sellerVerificationStats() {
        SellerVerificationStatsDTO status = sellerVerificationRequestRepository.getSellerVerificationStats();
        return status;
    }


    @Transactional
    public void approveSellerVerification(UUID requestId, String sellerUserName, String note, User currentUser) {

        SellerVerificationRequest req = preValidateVerificationRequestsApproval(requestId, sellerUserName, note, currentUser);

        if(req.getVerificationStatus().equals(SellerVerificationStatusEnum.APPROVED)){
            throw new IllegalArgumentException("Verification request is already approved for request ID: " + requestId);
        }

        req.setVerificationStatus(SellerVerificationStatusEnum.APPROVED);
        req.setDescription(note);
        req.setReviewedAt(Instant.now());

        sellerVerificationRequestRepository.save(req);

        Seller seller = req.getSeller();
        Boolean isVerified = seller.isVerified();

        seller.setVerified(true);
        sellerRepository.save(seller);

        // If the seller was not verified before, we create a user required action to notify them
        if(!isVerified) {
            UserRequiredActionContext context = UserRequiredActionContext.builder()
                    .title("Approved seller")
                    .content("Congratulations! Now you're a verified seller!")
                    .severityLevel(UserRequiredActionSeverityLevelEnum.LOW)
                    .continueUrl("/seller-verification-submit")
                    .canResolve(true)
                    .build();
        userDetailsService.registerUserRequiredAction(seller.getUser(),UserRequiredActionEnum.SELLER_VERIFIED_ANNOUNCEMENT, context);
        }

        Notification notification = Notification.builder()
                .notificationCategory(NotificationCategory.DEFAULT)
                .title("Seller account verification approved")
                .content("Your verification submission has been approved. Your account is now verified account.")
                .user(seller.getUser())
                .notificationCategoryGroup(NotificationCategoryGroup.DEFAULT)
                .build();

        notificationRepository.save(notification);

        adminActionService.logAdminAction(currentUser, seller.getUser(), AdminActionsEnum.VERIFICATION_DOCS_APPROVE,
                "Seller verification request approved by : " + currentUser.getUsername() + "for :"+ sellerUserName + ", request ID: " + requestId + ", note: " + note);
    }

    @Transactional
    public void rejectSellerVerification(UUID requestId, String sellerUserName, String note, User currentUser) {

        SellerVerificationRequest req = preValidateVerificationRequestsApproval(requestId, sellerUserName, note, currentUser);

        if(req.getVerificationStatus().equals(SellerVerificationStatusEnum.REJECTED)){
            throw new IllegalArgumentException("Verification request is already rejected for request ID: " + requestId);
        }

        req.setVerificationStatus(SellerVerificationStatusEnum.REJECTED);
        req.setDescription(note);
        req.setReviewedAt(Instant.now());
        sellerVerificationRequestRepository.save(req);

        Seller seller = req.getSeller();

        if(seller.isVerified()){
            boolean hasApprovedRequests = seller.getSellerVerificationRequests().stream()
                    .anyMatch(request -> request.getVerificationStatus() == SellerVerificationStatusEnum.APPROVED);
            if(!hasApprovedRequests){
                seller.setVerified(false);
                sellerRepository.save(seller);
                log.warn("Seller {} is now marked as unverified due to rejection of all approved requests, request ID: {}", seller.getUser().getUsername(), requestId);
            }
        }

        Notification notification = Notification.builder()
                .notificationCategory(NotificationCategory.DEFAULT)
                .title("Seller account verification rejected")
                .content("Your verification submission has been rejected. see more details from Seller verification section.")
                .user(seller.getUser())
                .notificationCategoryGroup(NotificationCategoryGroup.DEFAULT)
                .build();

        notificationRepository.save(notification);

        adminActionService.logAdminAction(currentUser,seller.getUser(),AdminActionsEnum.VERIFICATION_DOCS_REJECT,
                "seller :"+sellerUserName+" verification submission was rejected by admin: "+currentUser.getUsername());

        UserRequiredActionContext userRequiredActionContext = UserRequiredActionContext.builder()
                .title("Your verification request was rejected.")
                .canResolve(true)
                .severityLevel(UserRequiredActionSeverityLevelEnum.MEDIUM)
                .content("check the reasons provided by the admin and resubmit a new verification document.")
                .continueUrl("/seller-verification-submit")
                .build();

        UserRequiredAction useRreqAction = UserRequiredAction.builder()
                .actionType(UserRequiredActionEnum.SELLER_VERIFICATION_REJECT_ANNOUNCEMENT)
                .user(seller.getUser())
                .isResolved(false)
                .context(userRequiredActionContext.toMap())
                .build();


        userRequiredActionRepository.save(useRreqAction);

    }

    public void updateVerificationRequestNote(UUID requestId, String sellerUserName, String note, User currentUser) {
        SellerVerificationRequest req = preValidateVerificationRequestsApproval(requestId, sellerUserName, note, currentUser);

        req.setDescription(note);
        req.setReviewedAt(Instant.now());
        sellerVerificationRequestRepository.save(req);
        User user = req.getSeller().getUser();

        Notification notification = Notification.builder()
                .notificationCategory(NotificationCategory.DEFAULT)
                .title("Seller account verification update")
                .content("You have a new update about your submitted document")
                .user(user)
                .notificationCategoryGroup(NotificationCategoryGroup.DEFAULT)
                .build();

        notificationRepository.save(notification);

        adminActionService.logAdminAction(currentUser,user,AdminActionsEnum.VERIFICATION_DOCS_UPDATE,
                "note: "+note+" was added to seller "+sellerUserName+" seller verification submission"+" by admin: "+currentUser.getUsername());
    }

    private SellerVerificationRequest preValidateVerificationRequestsApproval(UUID requestId, String sellerUserName, String note, User currentUser) {
        if (requestId == null || sellerUserName == null || sellerUserName.isEmpty()) {
            throw new IllegalArgumentException("Request ID and seller username cannot be null or empty");
        }

        User sellerUser = userRepository.findByUsername(sellerUserName);
        if (sellerUser == null ) {
            throw new InvalidUserException("Seller user not found with username: " + sellerUserName);
        }
        Seller seller = sellerUser.getSeller();
        if (seller == null) {
            throw new InvalidUserException("User is not a seller: " + sellerUserName);
        }
        SellerVerificationRequest req = sellerVerificationRequestRepository.findByIdAndSellerId(requestId, seller.getId());
        if( req == null ) {
            throw new IllegalArgumentException("Verification request not found for request ID: " + requestId);
        }

        return req;
    }

    public SellerPublicProfileDTO getSellerPublicProfile(UUID sellerId) {
        Seller seller = sellerRepository.getSellerById(sellerId);
        if (seller == null) {
            throw new ResourceNotFoundException("Seller not found");
        }

        User user = seller.getUser();
        return SellerPublicProfileDTO.builder()
                .id(seller.getId())
                .username(user.getUsername())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .bio(user.getBio())
                .links(user.getSocialMediaLinks().stream().map(UserSocialMediaLink::getLink).toList())
                .profilePictureId(String.valueOf(user.getUpload().getId()))
                .bannerId(String.valueOf(seller.getBannerId()))
                .isVerified(seller.isVerified())
                .build();
    }

}
