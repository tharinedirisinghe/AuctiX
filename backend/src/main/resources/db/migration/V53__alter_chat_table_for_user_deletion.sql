ALTER TABLE chat_messages DROP CONSTRAINT chat_messages_sender_id_fkey;
ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES users(id)
ON DELETE CASCADE;

-- If you want to cascade delete from chat_room_participants too:
ALTER TABLE chat_room_participants DROP CONSTRAINT chat_room_participants_user_id_fkey;
ALTER TABLE chat_room_participants
ADD CONSTRAINT chat_room_participants_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;
