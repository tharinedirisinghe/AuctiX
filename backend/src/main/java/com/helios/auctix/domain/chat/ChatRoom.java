package com.helios.auctix.domain.chat;


import com.helios.auctix.domain.auction.Auction;
import com.helios.auctix.domain.user.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.Set;
import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Entity
@Table(name = "chat_rooms")
public class ChatRoom {

    @Id
    private UUID id;

    @OneToOne(optional = true)
    @JoinColumn(name = "auction_id", unique = true)
    private Auction auction;

    // TODO fix these joins etc
    @ManyToMany
    @JoinTable(
            name = "chat_room_participants",
            joinColumns = @JoinColumn(name = "chat_room_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private Set<User> participants;

    @OneToMany(mappedBy = "chatRoom", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<ChatMessage> chatMessages;


    @PrePersist
    public void prePersist() {
        this.id = UUID.randomUUID();  // so it won't give an error when we try to save a chat room without an id
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "chat_room_type")
    private ChatRoomType type;
}
