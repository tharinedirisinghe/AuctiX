package com.helios.auctix.dtos;

import com.helios.auctix.domain.complaint.ComplaintStatus;
import com.helios.auctix.domain.complaint.ReportTargetType;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ComplaintResponseDTO {
    private UUID id;
    private String readableId;
    private ReportTargetType targetType;
    private UUID targetId;
    private String reportedByUsername;
    private String reason;
    private String description;
    private LocalDateTime dateReported;
    private ComplaintStatus status;
    private UUID assignedTo;
}