/**
 * @module Users Page
 * @description Displays registered users with skeleton loading
 */

import { useEffect } from 'react';
import { useUsersStore } from '@/store/useUsersStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Users as UsersIcon, Mail, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

const UserSkeleton = () => (
  <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-48" />
    </div>
    <Skeleton className="h-3 w-20" />
  </div>
);

const Users = () => {
  const { users, isLoading, fetchUsers } = useUsersStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
          <UsersIcon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} registered members</p>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <UserSkeleton key={i} />)
          : users.map((user, i) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:shadow-card"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/20"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">{user.name}</h3>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    {user.email}
                  </span>
                </div>
                <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex">
                  <Calendar className="h-3 w-3" />
                  {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </motion.div>
            ))}
      </div>
    </div>
  );
};

export default Users;
