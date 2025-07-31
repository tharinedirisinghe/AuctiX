package com.helios.auctix.services.fileUpload;

import com.azure.core.util.BinaryData;
import com.azure.storage.blob.BlobClient;
import com.helios.auctix.config.AzureStorageConfig;
import com.helios.auctix.domain.upload.FileTypeEnum;
import com.helios.auctix.domain.upload.Upload;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.user.UserRole;
import com.helios.auctix.domain.user.UserRoleEnum;
import com.helios.auctix.repositories.BidderRepository;
import com.helios.auctix.repositories.UploadRepository;
import com.helios.auctix.repositories.UserRepository;
import jdk.jfr.ContentType;
import lombok.AllArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.flogger.Flogger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.data.domain.Limit;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.multipart.MultipartFile;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobContainerClientBuilder;
import com.azure.storage.common.StorageSharedKeyCredential;
import org.springframework.web.util.InvalidUrlException;


import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.*;
import java.util.logging.Logger;

import static com.helios.auctix.services.fileUpload.FileUploadUtilService.byteArrayToHex;
import static com.helios.auctix.services.fileUpload.FileUploadUtilService.getFileType;

@Service
@RequiredArgsConstructor
public class FileUploadService {
    private final UploadRepository uploadRepository;
    private final UserRepository userRepository;
    private final AzureStorageConfig azureStorageConfig;

    private static Logger log = Logger.getLogger(FileUploadService.class.getName());

    /**
     * Uploads a file to the specified directory as a public file.
     *
     * @param file The file to be uploaded.
     * @return A `FileUploadResponse` indicating the success or failure of the operation.
     */
    public FileUploadResponse uploadFile(MultipartFile file, FileUploadUseCaseEnum category){
        log.warning("unauthorized file upload request");
        return uploadFile(file, category ,(UUID) null , true);
    }

    /**
     * Uploads a file with ownership informations and access control.
     *
     * @param file The file to be uploaded.
     * @param ownerEmail The email of the user who owns the file.
     * @return A `FileUploadResponse` indicating the success or failure of the operation.
     */
    public FileUploadResponse uploadFile(MultipartFile file, FileUploadUseCaseEnum category ,String ownerEmail , boolean isPublic) {
        User user = userRepository.findByEmail(ownerEmail);
        if(user == null) {
            return new FileUploadResponse(false,"User not found");
        }
        return uploadFile(file ,category ,user.getId(), isPublic );
    }

    /**
     * Uploads a file with ownership informations and access control.
     *
     * @param file The file to be uploaded.
     * @param ownerUserId The UUID of the user who owns the file.
     * @return A `FileUploadResponse` indicating the success or failure of the operation.
     */
    public FileUploadResponse uploadFile(MultipartFile file, FileUploadUseCaseEnum category, UUID ownerUserId, boolean isPublic) {
        try {

            if(azureStorageConfig.getAccountName() == null || azureStorageConfig.getAccountKey() == null || azureStorageConfig.getContainerName() == null) {
                throw new IllegalArgumentException("Blob account configurations not found");
            }

            String originalFilename = file.getOriginalFilename();
            log.info("File upload request: "+originalFilename);

            FileTypeEnum filetype = getFileType(file.getContentType());
            log.info("File type: "+filetype);

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] fileBytes = file.getBytes();
            byte[] digestMsg = digest.digest(fileBytes);
            String sha256 = byteArrayToHex(digestMsg);
            log.info("File sha-256: "+sha256);

            UUID fileId = UUID.nameUUIDFromBytes(digestMsg);

            Long filesize = file.getSize();
            //TODO: Rate limit mechanism

            log.info("File Uploading to Azure Blob Storage");
            URI StorageContainer = azureStorageConfig.getStorageContainerURI();

            BlobContainerClient containerClient = new BlobContainerClientBuilder()
                    .endpoint(StorageContainer.toString())
                    .credential(new StorageSharedKeyCredential(azureStorageConfig.getAccountName(), azureStorageConfig.getAccountKey() ))
                    .buildClient();

            containerClient.createIfNotExists();

            BlobClient blobClient = containerClient.getBlobClient(fileId.toString());

            try (InputStream inputStream = file.getInputStream()) {
                blobClient.upload(inputStream, filesize, true);
                log.info("File uploaded to Azure Blob Storage: " + blobClient.getBlobUrl());
            }

            log.info("File Uploaded to : "+ StorageContainer.toString());
            Upload uploadInfo = Upload.builder()
                    .fileName(originalFilename)
                    .fileSize(filesize)
                    .fileType(filetype)
                    .hash256(sha256)
                    .fileId(fileId)
                    .ownerId(ownerUserId)
                    .isPublic(isPublic)
                    .category(category.toString())
                    .build();

            uploadRepository.save(uploadInfo);

            return new FileUploadResponse(true,"File uploaded successfully",uploadInfo) ;
        }
        catch (NoSuchAlgorithmException e) {
            log.warning(e.getMessage());
            return new FileUploadResponse(false,"File upload failed: ");
        }
        catch(URISyntaxException e) {
            log.warning(e.getMessage());
            return new FileUploadResponse(false,"File upload failed: " );
        }
        catch (IllegalArgumentException e) {
            log.warning(e.getMessage());
            return new FileUploadResponse(false, "File upload failed: " );
        }
        catch (IOException e) {
            log.warning(e.getMessage());
            return new FileUploadResponse(false,"File upload failed: " );
        }
    }

    /**
     * Retrieves a uploaded file from Azure Blob Storage.
     *
     * @param id The UUID of the file to be retrieved.
     * @param requestedUserEmail The email of the user requesting the file.
     * @return A `FileUploadResponse` indicating the success or failure of the operation.
     */
    public FileUploadResponse getFile(UUID id, String requestedUserEmail) {
        User user = userRepository.findByEmail(requestedUserEmail);
        if(user == null) {
            return new FileUploadResponse(false,"User not found");
        }
        return getFile(id, user.getId());
    }

    /**
     * Retrieves a uploaded file from Azure Blob Storage. only public files can be accessed with this method
     *
     * @param id The UUID of the file to be retrieved.
     * @return A `FileUploadResponse` indicating the success or failure of the operation.
     */
    public FileUploadResponse getFile(UUID id) {
        return getFile(id, (UUID) null);
    }

    /**
     * Retrieves a uploaded file from Azure Blob Storage.both public and private can be accessed with this method
     *
     * @param id The UUID of the recode to be retrieved.
     * @param requestedUserId The UUID of the user requesting the file.
     * @return A `FileUploadResponse` indicating the success or failure of the operation.
     */
    private FileUploadResponse getFile(UUID id, UUID requestedUserId ){
            if(azureStorageConfig.getAccountName() == null || azureStorageConfig.getAccountKey() == null || azureStorageConfig.getContainerName() == null) {
                throw new IllegalArgumentException("Blob account configurations not found");
            }

            Upload uploadedFileInfo = uploadRepository.findById(id).orElse(null);
            if(uploadedFileInfo == null) {
                return new FileUploadResponse(false,"File not found");
            }

            log.info("checking whether the file is deleted");
            if(uploadedFileInfo.getIsDeleted()) {
                return new FileUploadResponse(false,"File is deleted");
            }

            log.info("checking file ownership");
            if(uploadedFileInfo.getIsPublic()==false){
                User requestedUser = userRepository.findById(requestedUserId).orElse(null);
                if(requestedUser == null) {
                    return new FileUploadResponse(false,"Unautherized");
                }
                log.info("requested user: id: "+ requestedUser.getId() +" uploadFileInfo ownerId: "+ uploadedFileInfo.getOwnerId() +" " + (requestedUser.getId() == uploadedFileInfo.getOwnerId()));
                if(!(requestedUser.getId().equals(uploadedFileInfo.getOwnerId()) || requestedUser.getRoleEnum().equals(UserRoleEnum.ADMIN))) {
                    return new FileUploadResponse(false,"Only file owner and admins can access the private files");
                }

                log.info("File ownership verified");
            }

            log.info("Trying to get file from Azure Blob Storage");
            try {
                URI StorageContainer = azureStorageConfig.getStorageContainerURI();

                BlobContainerClient containerClient = new BlobContainerClientBuilder()
                        .endpoint(StorageContainer.toString())
                        .credential(new StorageSharedKeyCredential(azureStorageConfig.getAccountName(), azureStorageConfig.getAccountKey()))
                        .buildClient();

                BlobClient blobClient = containerClient.getBlobClient(uploadedFileInfo.getFileId().toString());
                if(!blobClient.exists()) {
                    log.warning("File not found in blob storage: " + blobClient.getBlobUrl());
                    return new FileUploadResponse(false,"File not found");
                }
                log.info("File found in Azure Blob Storage: " + blobClient.getBlobUrl());

                BinaryData binaryData =  blobClient.downloadContent();

                return new FileUploadResponse(true,"File found", binaryData, uploadedFileInfo);

            }
            catch(URISyntaxException e){
                log.warning(e.getMessage());
                return new FileUploadResponse(false,"Storage container url invalied: " );
            }
            catch (Exception e) {
                log.warning(e.getMessage());
                return new FileUploadResponse(false, "File upload failed: ");
            }

    }

    /**
     * mark the file as deleted in the database. marked files will deleted after a certain period of time
     *
     * @param fileId The UUID of the file to be deleted.
     * @param deleteRequestedUserId The UUID of the user requesting the deletion.
     * @return A `FileUploadResponse` indicating the success or failure of the operation.
     */
    public FileUploadResponse deleteFile(UUID fileId, UUID deleteRequestedUserId) {
        User user = userRepository.findById(deleteRequestedUserId).orElse(null);
        Upload fileToDelete = uploadRepository.findById(fileId).orElse(null);
        return deleteFile(fileToDelete, user);
    }

    /**
     * mark the file as deleted in the database. marked files will deleted after a certain period of time
     *
     * @param fileId The UUID of the file to be deleted.
     * @param deleteRequestedUserEmail The email of the user requesting the deletion.
     * @return A `FileUploadResponse` indicating the success or failure of the operation.
     */
    public FileUploadResponse deleteFile(UUID fileId,String deleteRequestedUserEmail) {
        User user = userRepository.findByEmail(deleteRequestedUserEmail);
        if(user == null) {
            return new FileUploadResponse(false,"User not found");
        }
        Upload fileToDelete = uploadRepository.findById(fileId).orElse(null);
        return deleteFile(fileToDelete, user);
    }

    /**
     * mark the file as deleted in the database. marked files will deleted after a certain period of time
     *
     * @param fileToDelete The file to be deleted.
     * @param deleteRequestedUser The UUID of the user requesting the deletion.
     * @return A `FileUploadResponse` indicating the success or failure of the operation.
     */
    public FileUploadResponse deleteFile(Upload fileToDelete, User deleteRequestedUser) {
        // only make the uploads isdeleted true

        if(fileToDelete == null) {
            return new FileUploadResponse(false,"File not found");
        }
        log.info("checking whether the file is deleted");
        if(fileToDelete.getIsDeleted()) {
            return new FileUploadResponse(false,"File is already deleted");
        }

        log.info("checking file delete permissions");
        if(deleteRequestedUser == null) {
            return new FileUploadResponse(false,"Unauthorized");
        }
        if(deleteRequestedUser.getId()== null && !(deleteRequestedUser.getRoleEnum().equals(UserRoleEnum.ADMIN) || deleteRequestedUser.getRoleEnum().equals(UserRoleEnum.SUPER_ADMIN))) {
            return new FileUploadResponse(false,"Only admins can delete the files without ownership");
        }
        if(!(deleteRequestedUser.getId().equals(fileToDelete.getOwnerId()) || deleteRequestedUser.getRoleEnum().equals(UserRoleEnum.ADMIN) || deleteRequestedUser.getRoleEnum().equals(UserRoleEnum.SUPER_ADMIN))) {
            return new FileUploadResponse(false,"Only file owner or admins can delete this file");
        }
        log.info("marking the file as deleted");
        fileToDelete.setIsDeleted(true);
        uploadRepository.save(fileToDelete);
        log.info("File marked as deleted");
        return new FileUploadResponse(true,"File deleted successfully");

    }


    public Boolean isFilePublic(UUID fileId) {
        Upload file = uploadRepository.findById(fileId).orElse(null);
        if(file == null) {
            return false;
        }
        return file.getIsPublic();
    }


}
