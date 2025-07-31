package com.helios.auctix.domain.user;

public enum SellerVerificationStatusEnum {
    NO_VERIFICATION_REQUESTED,
    REJECTED,
    PENDING,
    APPROVED;
    // Value must be ordered, more powerful Status must be at the end

    public static SellerVerificationStatusEnum fromString(String filterValue) {
        for (SellerVerificationStatusEnum status : SellerVerificationStatusEnum.values()) {
            if (status.name().equalsIgnoreCase(filterValue)) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown verification status: " + filterValue);
    }
}
