package com.helios.auctix.domain.complaint;

import com.helios.auctix.domain.user.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.GenericGenerator;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.UUID;

@Builder
@Entity
@Table(name = "complaints")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Complaint {
    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(
            name = "UUID",
            strategy = "org.hibernate.id.UUIDGenerator"
    )
    @Column(columnDefinition = "UUID DEFAULT gen_random_uuid()")
    private UUID id;

    @Column(name = "readable_id", unique = true, nullable = false, length = 10)
    private String readableId;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", nullable = false)
    private ReportTargetType targetType;

    @Column(name = "target_id", nullable = false)
    private UUID targetId; // User/Auction id

    @ManyToOne
    @JoinColumn(name = "reported_by_id", nullable = false)
    private User reportedBy;

    @NotBlank
    @Column(length = 100, nullable = false)
    private String reason;

    @Column(length = 1500)
    private String description;

    @NotNull
    @Column(name = "date_reported", nullable = false)
    private LocalDateTime dateReported;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ComplaintStatus status;

    @Column(name = "assigned_to", nullable = true)
    private UUID assignedTo;

    @PrePersist
    public void generateReadableId() {
        if (this.readableId == null || this.readableId.isBlank()) {
            this.readableId = "CMP-" + generateShortCode(4);
        }
    }

    private String generateShortCode(int length) {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < length; i++) {
            sb.append(chars.charAt(random.nextInt(chars.length())));
        }
        return sb.toString();
    }

}

