package com.helios.auctix.domain.feedback;

import com.google.firebase.database.annotations.NotNull;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {
    @Id
    @GeneratedValue
    @Column(nullable = false)
    private UUID id;

    // Nullable for guests
    @Column(name = "username", nullable = true)
    private String username;

    @Column(name = "rating", nullable = false)
    @NotNull
    private int rating;

    @Column(length = 1000)
    @NotNull
    private String comment;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt = LocalDateTime.now();
}
