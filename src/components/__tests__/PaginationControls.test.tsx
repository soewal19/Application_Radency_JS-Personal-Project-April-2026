/**
 * @module Frontend Tests — Pagination
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PaginationControls from '@/components/PaginationControls';

describe('PaginationControls', () => {
  it('renders nothing for single page', () => {
    const { container } = render(
      <PaginationControls page={1} totalPages={1} onPageChange={() => {}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page buttons', () => {
    render(
      <PaginationControls page={1} totalPages={3} onPageChange={() => {}} />
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onPageChange when clicked', () => {
    const onPageChange = vi.fn();
    render(
      <PaginationControls page={1} totalPages={3} onPageChange={onPageChange} />
    );
    fireEvent.click(screen.getByText('2'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
