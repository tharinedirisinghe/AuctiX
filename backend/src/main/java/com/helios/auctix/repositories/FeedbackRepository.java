package com.helios.auctix.repositories;

import com.helios.auctix.domain.feedback.Feedback;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FeedbackRepository extends JpaRepository<Feedback, UUID> {
    Page<Feedback> findByCommentContainingIgnoreCase(String query, Pageable pageable);
    Page<Feedback> findByRating(int rating, Pageable pageable);
    Page<Feedback> findByCommentContainingIgnoreCaseAndRating(String query, int rating, Pageable pageable);
}
