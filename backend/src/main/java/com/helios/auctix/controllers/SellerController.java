package com.helios.auctix.controllers;

import com.azure.core.util.BinaryData;
import com.helios.auctix.domain.user.SellerVerificationStatusEnum;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.dtos.VerificationStatusDTO;
import com.helios.auctix.services.fileUpload.FileUploadResponse;
import com.helios.auctix.services.fileUpload.FileUploadService;
import com.helios.auctix.services.user.SellerService;
import com.helios.auctix.services.user.UserDetailsService;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.websocket.AuthenticationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/seller")
@AllArgsConstructor
public class SellerController {

    private final SellerService sellerService;
    private final UserDetailsService userDetailsService;
    private final FileUploadService fileUploadService;

    @GetMapping("/hello")
    public String hello() {
        return "Hello from SellerController!";
    }

    @GetMapping("/sellerVerificationStatus")
    public VerificationStatusDTO getSellerVerificationStatus() throws AuthenticationException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        return sellerService.sellerVerifiedStatus(currentUser);
    }

    @PostMapping("/submitSellerVerifications")
    public SellerVerificationStatusEnum submitSellerVerifications(
            @RequestParam("files") MultipartFile[] files
    ) throws AuthenticationException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        return sellerService.submitSellerVerifications(currentUser,files);
    }

    @PostMapping("/document/{id}")
    public ResponseEntity<?> viewDocument(@PathVariable("id") UUID id) throws AuthenticationException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        FileUploadResponse res = null;
        if (!fileUploadService.isFilePublic(id)) {
            log.info("getting banner file by user " + currentUser.getEmail());

            // Get file upload data
            res = fileUploadService.getFile(id, currentUser.getEmail());
        } else {
            res = fileUploadService.getFile(id);
        }

        if (!res.isSuccess()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(res.getMessage());
        }

        BinaryData binaryFile = res.getBinaryData();
        String fileName = res.getUpload().getFileName();
        String contentType = res.getUpload().getFileType().getContentType();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(binaryFile.toBytes());
    }

}
