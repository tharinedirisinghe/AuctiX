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
        UUID userId = null;
        if (authentication != null && authentication.isAuthenticated() && !"anonymousUser".equals(authentication.getPrincipal())) {
            User user = userDetailsService.getAuthenticatedUser(authentication);
            if (user != null) {
                userId = user.getId();
            }
        }
        feedbackService.saveFeedback(feedbackDTO.getRating(), feedbackDTO.getComment(), userId);
        return ResponseEntity.ok("Thanks for your feedback!");
    }

    @GetMapping
    public ResponseEntity<?> getAllFeedbacks(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("submittedAt").descending());
        Page<Feedback> feedbackPage = feedbackRepository.findAll(pageable);
        return ResponseEntity.ok(feedbackPage);
    }

}
