package com.helios.auctix.repositories;

import com.helios.auctix.domain.feedback.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {
    List<Feedback> findByUserIdOrderBySubmittedAtDesc(UUID userId);
}
