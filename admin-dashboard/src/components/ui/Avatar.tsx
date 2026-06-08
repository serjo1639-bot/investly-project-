'use client';

/**
 * Avatar component — shows either a profile photo or a coloured circle with initials.
 * The background colour is chosen deterministically from the user's name so the same
 * person always gets the same colour (no random flicker on re-render).
 */

import React from 'react';
import { getInitials } from '@/lib/utils';

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-teal-500', 'bg-amber-500',
  'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500', 'bg-emerald-500',
];

/**
 * Picks a colour from AVATAR_COLORS based on the name string.
 * We use a simple hash (djb2-style) so the same name always produces the same index.
 * `charCodeAt` gets the numeric ASCII/Unicode value of each character.
 * `<< 5` is a fast way to multiply the hash by 32 before mixing in the next character.
 */
function getColorForName(name: string): string {
  const safe = name || '?';
  let hash = 0;
  for (let i = 0; i < safe.length; i++) {
    hash = safe.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  xs: { container: 'w-6 h-6', text: 'text-[9px]' },
  sm: { container: 'w-8 h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm' },
  lg: { container: 'w-12 h-12', text: 'text-base' },
  xl: { container: 'w-16 h-16', text: 'text-xl' },
};

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  // Look up the Tailwind classes for the requested size (defaults to 'md').
  const sizes = sizeMap[size];
  const safeName = name || '?';
  const color = getColorForName(safeName);

  // If a photo URL is provided, show it. Otherwise fall back to the initials circle.
  if (src) {
    return (
      <img
        src={src}
        alt={safeName}
        className={`${sizes.container} rounded-full object-cover flex-shrink-0 border-2 border-white`}
      />
    );
  }

  return (
    <div
      className={`${sizes.container} ${color} rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white`}
    >
      <span className={`${sizes.text} font-semibold text-white leading-none`}>
        {getInitials(safeName)}
      </span>
    </div>
  );
}
