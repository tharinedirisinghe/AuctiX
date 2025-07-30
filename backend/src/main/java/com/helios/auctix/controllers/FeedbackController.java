package com.helios.auctix.controllers;

import com.helios.auctix.domain.feedback.Feedback;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.dtos.FeedbackDTO;
import com.helios.auctix.repositories.FeedbackRepository;
import com.helios.auctix.services.FeedbackService;
import com.helios.auctix.services.user.UserDetailsService;
import org.apache.tomcat.websocket.AuthenticationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final FeedbackService feedbackService;
    private final FeedbackRepository feedbackRepository;
    private final UserDetailsService userDetailsService;

    public FeedbackController(FeedbackService feedbackService, FeedbackRepository feedbackRepository, UserDetailsService userDetailsService) {
        this.feedbackService = feedbackService;
        this.feedbackRepository = feedbackRepository;
        this.userDetailsService = userDetailsService;
    }

    @PostMapping
    public ResponseEntity<String> submitFeedback(@RequestBody FeedbackDTO feedbackDTO) throws AuthenticationException {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = null;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            User user = userDetailsService.getAuthenticatedUser(authentication);
            if (user != null) {
                username = user.getUsername();
            }
        }
        feedbackService.saveFeedback(feedbackDTO.getRating(), feedbackDTO.getComment(), username);
        return ResponseEntity.ok("Thanks for your feedback!");
    }

    @GetMapping
    public ResponseEntity<?> getAllFeedbacks(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "size", defaultValue = "10") int size,
            @RequestParam(value = "query", required = false) String query,
            @RequestParam(value = "rating", required = false) Integer rating,
            @RequestParam(value = "sortBy", defaultValue = "submittedAt") String sortBy,
            @RequestParam(value = "sortDir", defaultValue = "desc") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Feedback> feedbackPage;
        if (query != null && !query.isEmpty() && rating != null) {
            feedbackPage = feedbackRepository.findByCommentContainingIgnoreCaseAndRating(query, rating, pageable);
        } else if (query != null && !query.isEmpty()) {
            feedbackPage = feedbackRepository.findByCommentContainingIgnoreCase(query, pageable);
        } else if (rating != null) {
            feedbackPage = feedbackRepository.findByRating(rating, pageable);
        } else {
            feedbackPage = feedbackRepository.findAll(pageable);
        }
        return ResponseEntity.ok(feedbackPage);
    }

}
