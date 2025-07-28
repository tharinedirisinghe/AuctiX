ALTER TABLE chat_room_participants
DROP CONSTRAINT chat_room_participants_user_id_fkey;

ALTER TABLE chat_room_participants
ADD CONSTRAINT chat_room_participants_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES users(id)
ON DELETE CASCADE;