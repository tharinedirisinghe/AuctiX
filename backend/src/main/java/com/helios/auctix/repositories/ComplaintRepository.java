package com.helios.auctix.repositories;

import com.helios.auctix.domain.complaint.Complaint;
import com.helios.auctix.domain.complaint.ComplaintStatus;
import com.helios.auctix.domain.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {
    List<Complaint> findByReportedByOrderByDateReported(User reportedBy);
    Page<Complaint> findByReportedBy_UsernameContainingIgnoreCaseOrReasonContainingIgnoreCase(
            String username, String reason, String search, Pageable pageable);
    Page<Complaint> findByReasonContainingIgnoreCaseOrReportedBy_UsernameContainingIgnoreCaseOrReadableIdContainingIgnoreCase(
            String reason, String username, String readableId, Pageable pageable);
    Page<Complaint> findByStatus(
            ComplaintStatus status, Pageable pageable);

    Page<Complaint> findByStatusAndReasonContainingIgnoreCaseOrReportedBy_UsernameContainingIgnoreCaseOrReadableIdContainingIgnoreCase(ComplaintStatus status, String reason, String username, String readableId, Pageable pageable);

    int countByStatus(ComplaintStatus status);
}