package com.helios.auctix.domain.user;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "sellers" )
@ToString(exclude = "user") // or else we get cyclic dependency
public class Seller {

    @Id
    @JsonIgnore
    private UUID id;

    @Column(name="is_verified",nullable = false)
    private boolean isVerified;

    @Column(name="is_active" , nullable = false)
    private boolean isActive;

    @Column(name="banner_id", nullable = true)
    private UUID bannerId;

    @JsonIgnore
    @OneToMany(mappedBy = "seller", fetch = FetchType.LAZY)
    private List<SellerVerificationRequest> sellerVerificationRequests;

    @OneToOne
    @MapsId
    @JsonIgnore
    @JoinColumn(name = "id")
    private User user;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID();
        }
    }

}
