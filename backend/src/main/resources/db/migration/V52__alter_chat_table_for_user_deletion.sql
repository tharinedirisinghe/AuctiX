ALTER TABLE chat_messages DROP CONSTRAINT chat_messages_sender_id_fkey;
ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_sender_id_fkey
FOREIGN KEY (sender_id)
REFERENCES users(id)
ON DELETE SET NULL;