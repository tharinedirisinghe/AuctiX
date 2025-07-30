package com.helios.auctix.controllers;

import com.helios.auctix.domain.complaint.Complaint;
import com.helios.auctix.domain.complaint.ComplaintActivity;
import com.helios.auctix.domain.complaint.ComplaintStatus;
import com.helios.auctix.dtos.ComplaintActivityDTO;
import com.helios.auctix.dtos.ComplaintDTO;
import com.helios.auctix.dtos.ComplaintResponseDTO;
import com.helios.auctix.services.ComplaintService;
import lombok.extern.slf4j.Slf4j;
import org.apache.tomcat.websocket.AuthenticationException;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/complaints")
public class ComplainController {

    private final ComplaintService complaintService;

    public ComplainController(ComplaintService complaintService) {
        this.complaintService = complaintService;

    }


    @PostMapping
    public ResponseEntity<ComplaintResponseDTO> createComplaint(@Valid @RequestBody ComplaintDTO complaintDto) throws AuthenticationException {
        Complaint complaint = complaintService.createComplaint(complaintDto);
        ComplaintResponseDTO responseDTO = ComplaintResponseDTO.builder()
                .id(complaint.getId())
                .readableId(complaint.getReadableId())
                .targetType(complaint.getTargetType())
                .targetId(complaint.getTargetId())
                .reportedByUsername(complaint.getReportedBy().getUsername())
                .reason(complaint.getReason())
                .description(complaint.getDescription())
                .dateReported(complaint.getDateReported())
                .status(complaint.getStatus())
                .build();
        return ResponseEntity.ok(responseDTO);
    }


    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getAllComplaints(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(value = "sortby", required = false, defaultValue = "dateReported") String sortBy,
        @RequestParam(value = "order", required = false, defaultValue = "desc") String order,
        @RequestParam(value = "search", required = false) String search,
        @RequestParam(value = "status", required = false) ComplaintStatus status){

        try {
            Page<Complaint> complaintPage = complaintService.getAllComplaints(page, size, sortBy, order, search, status);
            Map<String, Object> response = new HashMap<>();
            response.put("content", complaintPage.getContent());
            response.put("totalPages", complaintPage.getTotalPages());
            response.put("size", complaintPage.getSize());
            response.put("pageable", Map.of("pageNumber", complaintPage.getNumber()));
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Integer>> getComplaintStats() {
        Map<String, Integer> stats = complaintService.getComplaintStats();
        return ResponseEntity.ok(stats);
    }


    @GetMapping("/{id}")
    public ResponseEntity<Complaint> getComplaint(@PathVariable UUID id) {
        return ResponseEntity.ok(complaintService.getComplaintById(id));
    }

    @PutMapping("/{id}/status")
    //@PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Complaint> updateComplaintStatus(
            @PathVariable UUID id,
            @RequestBody ComplaintStatus status
    ) throws AuthenticationException {
        return ResponseEntity.ok(complaintService.updateComplaintStatus(id, status));
    }

    @GetMapping("/user/{username}")
    public ResponseEntity<List<Complaint>> getUserComplaints(@PathVariable String username) {
        return ResponseEntity.ok(complaintService.getComplaintsByUser(username));
    }

    @GetMapping("/{id}/timeline")
    public ResponseEntity<List<ComplaintActivityDTO>> getComplaintTimeline(@PathVariable UUID id) {
        List<ComplaintActivity> timeline = complaintService.getComplaintTimeline(id);

        List<ComplaintActivityDTO> dtos = timeline.stream()
                .map(activity -> ComplaintActivityDTO.builder()
                        .id(activity.getId().toString())
                        .type(activity.getType())
                        .message(activity.getMessage())
                        .performedBy(activity.getPerformedBy())
                        .timestamp(activity.getTimestamp())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<ComplaintActivityDTO> addComment(
            @PathVariable UUID id,
            @RequestBody String comment
    ) throws AuthenticationException {

        ComplaintActivity activity = complaintService.addComment(id, comment);

        ComplaintActivityDTO dto = ComplaintActivityDTO.builder()
                .id(activity.getId().toString())
                .type(activity.getType())
                .message(activity.getMessage())
                .performedBy(activity.getPerformedBy())
                .timestamp(activity.getTimestamp())
                .build();

        return ResponseEntity.ok(dto);
    }


}