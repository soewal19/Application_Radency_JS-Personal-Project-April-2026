/**
 * @module Pagination
 * @description Компонент пагинации
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PaginationControls = ({ page, totalPages, onPageChange }: PaginationProps) => {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const visiblePages = pages.filter(
    p => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <div className="flex items-center justify-center gap-1 py-6">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="h-9 w-9"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {visiblePages.map((p, i) => {
        const prev = visiblePages[i - 1];
        const showEllipsis = prev && p - prev > 1;
        return (
          <span key={p} className="flex items-center">
            {showEllipsis && <span className="px-2 text-muted-foreground">…</span>}
            <Button
              variant={p === page ? 'default' : 'outline'}
              size="icon"
              onClick={() => onPageChange(p)}
              className="h-9 w-9"
            >
              {p}
            </Button>
          </span>
        );
      })}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="h-9 w-9"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default PaginationControls;
