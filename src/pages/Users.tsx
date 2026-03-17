/**
 * @module Users Page
 * @description Displays registered users with skeleton loading and pagination
 */

import { useEffect, useState } from 'react';
import { useUsersStore } from '@/store/useUsersStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Users as UsersIcon, Mail, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

const PAGE_SIZE = 10;

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

const buildPageNumbers = (current: number, total: number): (number | '...')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
};

const Users = () => {
  const { users, isLoading, fetchUsers } = useUsersStore();
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchUsers();
    setCurrentPage(1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
  const pageUsers = users.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const start = users.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const end = Math.min(currentPage * PAGE_SIZE, users.length);

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
          <UsersIcon className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading...' : `${users.length} registered members`}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {isLoading
          ? Array.from({ length: PAGE_SIZE }).map((_, i) => <UserSkeleton key={i} />)
          : pageUsers.map((user, i) => (
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

      {!isLoading && users.length > PAGE_SIZE && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-xs text-muted-foreground">
            Showing {start}–{end} of {users.length} users
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(p => p - 1); }}
                  aria-disabled={currentPage === 1}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>

              {buildPageNumbers(currentPage, totalPages).map((page, i) =>
                page === '...' ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={page === currentPage}
                      onClick={(e) => { e.preventDefault(); setCurrentPage(page as number); }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(p => p + 1); }}
                  aria-disabled={currentPage === totalPages}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default Users;
