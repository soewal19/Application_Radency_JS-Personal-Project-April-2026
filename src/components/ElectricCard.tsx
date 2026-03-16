/**
 * @module ElectricCard
 * @description Card wrapper with animated electric/glowing border effect
 * Inspired by React Bits electric card pattern
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ElectricCardProps {
  children: ReactNode;
  className?: string;
}

const ElectricCard = ({ children, className }: ElectricCardProps) => {
  return (
    <div className={cn('electric-card-wrapper group relative', className)}>
      {/* Animated gradient border */}
      <div className="electric-border pointer-events-none absolute -inset-[1px] rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative rounded-xl bg-card">
        {children}
      </div>
    </div>
  );
};

export default ElectricCard;
