package com.helios.auctix.domain.user;

import com.fasterxml.jackson.annotation.*;
import com.helios.auctix.domain.notification.preferences.NotificationEventPreference;
import com.helios.auctix.domain.notification.preferences.NotificationGlobalPreference;
import com.helios.auctix.domain.upload.Upload;
import jakarta.persistence.*;
import lombok.*;

import java.io.Serial;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "Users" )
public class User {
    @Id
    @JsonIgnore
    private UUID id;

    @PrePersist
    protected void addRandUUID() {
        this.id = UUID.randomUUID();  // so it won't give an error when we try to save a user without an id
    }

    @Column(unique = true, nullable = false)
    private String username;

    @Column(unique = true, nullable = false)
    private String email;

    @JsonIgnore
    private String passwordHash;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @OneToOne(fetch = FetchType.LAZY)
    @JsonProperty("profile_photo")
    @JoinColumn(name = "profile_photo_id", nullable = true , referencedColumnName = "id")
    private Upload upload;

    @ManyToOne
    @JsonIgnore
    @JoinColumn(name = "role_id", nullable = false)
    private UserRole role;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id", nullable = false, referencedColumnName = "id")
    private Seller seller;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id", nullable = false, referencedColumnName = "id")
    private Admin admin;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id", nullable = false, referencedColumnName = "id")
    private Bidder bidder;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id")
    private UserAddress userAddress;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PasswordResetRequest> passwordResetRequest;

    @Column(name = "is_suspended", nullable = false)
    private boolean isSuspended = false;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<SuspendedUser> suspensions;

    @OneToMany(mappedBy = "suspendedBy", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    private List<SuspendedUser> suspensionsIssued;

    // helper method to make it cleaner to get the role enum
    @JsonProperty("role")
    public UserRoleEnum getRoleEnum() {
        return role.getName();
    }

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<UserFCMToken> fcmTokens;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private NotificationEventPreference notificationEventPreference;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private NotificationGlobalPreference notificationGlobalPreference;
}
