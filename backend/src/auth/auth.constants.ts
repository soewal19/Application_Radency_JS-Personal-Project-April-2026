import { SetMetadata } from '@nestjs/common';

/**
 * @module Auth Constants
 * @description Shared constants for authentication
 */

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
