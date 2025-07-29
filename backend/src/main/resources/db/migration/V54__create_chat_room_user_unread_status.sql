CREATE TABLE chat_room_user_unread_status (
    chat_room_id UUID NOT NULL,
    user_id UUID NOT NULL,
    unread_count INTEGER DEFAULT 0 NOT NULL,
    last_read_timestamp TIMESTAMP,
    last_notified_at TIMESTAMP,
    notification_count INTEGER DEFAULT 0 NOT NULL,
    PRIMARY KEY (chat_room_id, user_id),
    CONSTRAINT fk_cruus_chat_room FOREIGN KEY (chat_room_id) REFERENCES chat_rooms(id) ON DELETE CASCADE,
    CONSTRAINT fk_cruus_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- add the unread status for the already existing chat room users
INSERT INTO chat_room_user_unread_status (chat_room_id, user_id, unread_count, notification_count)
SELECT chat_room_id, user_id, 0, 0
FROM chat_room_participants
ON CONFLICT (chat_room_id, user_id) DO NOTHING;


-- Function to insert unread status row on participant insert
CREATE OR REPLACE FUNCTION trg_insert_unread_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert a row into chat_room_user_unread_status for the new participant if not exists
    INSERT INTO chat_room_user_unread_status (
        chat_room_id,
        user_id,
        unread_count,
        notification_count
    )
    VALUES (
        NEW.chat_room_id,
        NEW.user_id,
        0,
        0
    )
    ON CONFLICT (chat_room_id, user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on insert on chat_room_participants
CREATE TRIGGER trg_after_insert_participant
AFTER INSERT ON chat_room_participants
FOR EACH ROW
EXECUTE FUNCTION trg_insert_unread_status();
