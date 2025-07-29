package com.helios.auctix.services;

import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.complaint.ActivityType;
import com.helios.auctix.domain.complaint.Complaint;
import com.helios.auctix.domain.complaint.ComplaintActivity;
import com.helios.auctix.domain.complaint.ComplaintStatus;
import com.helios.auctix.domain.user.User;
import com.helios.auctix.dtos.ComplaintDTO;
import com.helios.auctix.repositories.AuctionRepository;
import com.helios.auctix.repositories.ComplaintActivityRepository;
import com.helios.auctix.repositories.ComplaintRepository;
import com.helios.auctix.repositories.UserRepository;
import com.helios.auctix.services.user.UserDetailsService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.websocket.AuthenticationException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
public class ComplaintService {
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final UserDetailsService userDetailsService;
    private final AuctionRepository auctionRepository;

    public ComplaintService(ComplaintRepository complaintRepository, UserRepository userRepository, AuctionRepository auctionRepository, UserDetailsService userDetailsService) {
        this.complaintRepository = complaintRepository;
        this.auctionRepository = auctionRepository;
        this.userRepository = userRepository;
        this.userDetailsService = userDetailsService;

    }

    public Complaint createComplaint(@Valid ComplaintDTO complaintDto) throws AuthenticationException {
        switch (complaintDto.getTargetType()) {
            case USER -> {
                userRepository.findById(complaintDto.getTargetId())
                        .orElseThrow(() -> new RuntimeException("User not found"));
            }
            case AUCTION -> {
                auctionRepository.findById(complaintDto.getTargetId())
                        .orElseThrow(() -> new RuntimeException("Auction not found"));
            }
        }


        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        Complaint complaint = new Complaint();

        complaint.setTargetId(complaintDto.getTargetId());
        complaint.setTargetType(complaintDto.getTargetType());
        complaint.setReportedBy(currentUser);
        complaint.setReason(complaintDto.getReason());
        complaint.setDescription(complaintDto.getDescription());
        complaint.setDateReported(LocalDateTime.now());
        complaint.setStatus(ComplaintStatus.PENDING);
        Complaint savedComplaint = complaintRepository.save(complaint);

        logActivity(complaint, ActivityType.REPORT_SUBMITTED, "Complaint submitted by " + complaint.getReportedBy().getFirstName() , currentUser.getUsername());

        return savedComplaint;
    }

    public Page<Complaint> getAllComplaints(Integer limit, Integer offset, String sortBy, String order, String search) {
        Sort.Direction direction = order.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
        Pageable pageable = PageRequest.of(offset, limit, Sort.by(direction, sortBy));

        log.info("limit: {}, offset: {}, sortBy: {}, order: {}, search: {}", limit, offset, sortBy, order, search);
        if (search != null && !search.trim().isEmpty()) {
            log.info("search: {}", search);
            return complaintRepository.findByReportedBy_UsernameContainingIgnoreCaseOrReasonContainingIgnoreCase(search,search,search, pageable);
        } else {
            return complaintRepository.findAll(pageable);
        }
    }

    public Complaint getComplaintById(UUID id) {
        return complaintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Complaint not found with id: " + id));
    }

    public List<Complaint> getComplaintsByUser(String username) {
        User user = userDetailsService.getUserByUsername(username);
        if(user == null) {
            throw new RuntimeException("User not found");
        }
        return complaintRepository.findByReportedByOrderByDateReportedDesc(user);
    }

    @Transactional
    public Complaint updateComplaintStatus(UUID id, ComplaintStatus newStatus) throws AuthenticationException {
        Complaint complaint = getComplaintById(id);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        logActivity(complaint, ActivityType.STATUS_CHANGE, "changed status from " + complaint.getStatus() + " to " + newStatus, currentUser.getUsername());
        complaint.setStatus(newStatus);
        return complaintRepository.save(complaint);
    }

    public ComplaintActivity addComment(UUID complaintId, String comment) throws AuthenticationException {
        Complaint complaint = getComplaintById(complaintId);

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = userDetailsService.getAuthenticatedUser(authentication);

        return logActivity(complaint, ActivityType.COMMENT, comment, currentUser.getUsername());
    }

    @Autowired
    private ComplaintActivityRepository activityRepository;

    private ComplaintActivity logActivity(Complaint complaint, ActivityType type, String message, String performedBy) {
        ComplaintActivity activity = new ComplaintActivity();
        activity.setComplaint(complaint);
        activity.setType(type);
        activity.setMessage(message);
        activity.setPerformedBy(performedBy);
        activity.setTimestamp(LocalDateTime.now());
        return activityRepository.save(activity);
    }

    public List<ComplaintActivity> getComplaintTimeline(UUID complaintId) {
        Complaint complaint = getComplaintById(complaintId);
        return activityRepository.findByComplaintOrderByTimestampDesc(complaint);
    }

}