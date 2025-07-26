import { motion } from 'framer-motion';
import { Avatar } from '@/components/atoms/Avatar';
import { IUser } from '@/types/IUser';

interface UserProfileCardProps {
  user: IUser;
}

export function UserProfileCard({ user }: UserProfileCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
    >
      <Avatar
        src={user.profile_photo}
        alt={`${user.firstName}'s profile picture`}
        size="lg"
      />
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground truncate">{`${user.firstName} ${user.lastName}`}</h3>
        <p className="text-sm text-muted-foreground truncate">{user.email}</p>
        <p className="text-xs text-muted-foreground">
          Username: {user.username}
        </p>
      </div>
    </motion.div>
  );
}
