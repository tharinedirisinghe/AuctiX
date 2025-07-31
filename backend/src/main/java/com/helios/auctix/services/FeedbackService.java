package com.helios.auctix.services;

import com.helios.auctix.domain.feedback.Feedback;
import com.helios.auctix.repositories.FeedbackRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class FeedbackService {

    @Autowired
    private FeedbackRepository feedbackRepository;

    public void saveFeedback(int rating, String comment, String username) {
        Feedback feedback = new Feedback();
        feedback.setUsername(username); // Nullable for guests
        feedback.setRating(rating);
        feedback.setComment(comment);
        feedback.setSubmittedAt(LocalDateTime.now());

        feedbackRepository.save(feedback);
    }

}
