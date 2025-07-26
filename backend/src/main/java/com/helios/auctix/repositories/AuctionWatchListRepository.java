package com.helios.auctix.repositories;

import com.helios.auctix.domain.user.User;
import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.watchlist.AuctionWatchList;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AuctionWatchListRepository extends JpaRepository<AuctionWatchList, UUID> {
    boolean existsByUserAndAuction(User user, Auction auction);

    Optional<AuctionWatchList> findByUserAndAuction(User user, Auction auction);

    @Query("SELECT aw.user FROM AuctionWatchList aw WHERE aw.auction.id = :auctionId")
    List<User> findUsersWatchingAuction(@Param("auctionId") UUID auctionId);

    @Query("""
        SELECT wl FROM AuctionWatchList wl
        JOIN wl.auction a
        WHERE wl.user.id = :userId
          AND (
            :search IS NULL OR :search = ''
            OR LOWER(a.title) LIKE LOWER(CONCAT('%', :search, '%'))
            OR LOWER(a.description) LIKE LOWER(CONCAT('%', :search, '%'))
          )
        ORDER BY wl.watchedAt DESC
    """)
    Page<AuctionWatchList> findWatchedAuctionsWithSearch(
            @Param("userId") UUID userId,
            @Param("search") String search,
            Pageable pageable
    );

    @Query(value = """
    SELECT wl.*
    FROM auction_watch_list wl
    JOIN auctions a ON wl.auction_id = a.id
    WHERE wl.user_id = :userId
      AND (
        :tsQuery IS NULL
        OR a.search_vector @@ to_tsquery('english', :tsQuery)
      )
    ORDER BY
      CASE WHEN :tsQuery IS NOT NULL THEN ts_rank(a.search_vector, to_tsquery('english', :tsQuery)) ELSE 0 END DESC,
      wl.watched_at DESC
    LIMIT :limit OFFSET :offset
    """, nativeQuery = true)
    List<AuctionWatchList> findWatchedAuctionsWithFullTextSearch(
            @Param("userId") UUID userId,
            @Param("tsQuery") String tsQuery,
            @Param("limit") int limit,
            @Param("offset") int offset);

    @Query(value = """
    SELECT COUNT(*)
    FROM auction_watch_list wl
    JOIN auctions a ON wl.auction_id = a.id
    WHERE wl.user_id = :userId
      AND (
        :tsQuery IS NULL
        OR a.search_vector @@ to_tsquery('english', :tsQuery)
      )
    """, nativeQuery = true)
    long countWatchedAuctionsWithFullTextSearch(
            @Param("userId") UUID userId,
            @Param("tsQuery") String tsQuery);


    Page<AuctionWatchList> findByUserId(UUID userId, Pageable pageable);

}
