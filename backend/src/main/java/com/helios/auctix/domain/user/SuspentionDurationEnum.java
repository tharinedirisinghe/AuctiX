package com.helios.auctix.domain.user;

public enum SuspentionDurationEnum {
    ONE_DAY("1 Day"),
    THREE_DAYS("3 Days"),
    ONE_WEEK("1 Week"),
    TWO_WEEKS("2 Weeks"),
    ONE_MONTH("1 Month"),
    THREE_MONTHS("3 Months"),
    SIX_MONTHS("6 Months"),
    ONE_YEAR("1 Year"),
    PERMANENT("Permanent");

    private final String duration;

    SuspentionDurationEnum(String duration) {
        this.duration = duration;
    }

    public String getDuration() {
        return duration;
    }
}
