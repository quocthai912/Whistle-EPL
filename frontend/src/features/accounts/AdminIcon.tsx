import type { ReactNode } from 'react';

const shapes = {
  club: (
    <>
      <path d="M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6L12 3Z" />
      <path d="m12 7 3 2-1 3h-4L9 9l3-2Zm-2 5-2 3m6-3 2 3m-4-8V5" />
    </>
  ),
  accounts: (
    <>
      <path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z" />
      <circle cx="12" cy="10" r="2" />
      <path d="M8 16c0-4 8-4 8 0" />
    </>
  ),
  delegations: (
    <>
      <circle cx="9" cy="7" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 10-4m2 3 2 2 4-5" />
    </>
  ),
  audit: (
    <>
      <path d="M3 10a9 9 0 1 1 1 7M3 4v6h6m3-3v5l3 2" />
    </>
  ),
  season: (
    <>
      <path d="M6.5 3.5h11v4a5.5 5.5 0 0 1-11 0v-4Z" />
      <path d="M6.5 5.5H3v1.25a4.5 4.5 0 0 0 4.5 4.5m10-5.75H21v1.25a4.5 4.5 0 0 1-4.5 4.5" />
      <path d="M12 13v4.5m-3.5 0h7l1.5 3h-10l1.5-3Z" />
    </>
  ),
  regulations: (
    <path d="M12 6.5C9 4.5 5.5 4 3 5v14c3-1 6-.5 9 1.5m0-14c3-2 6.5-2.5 9-1.5v14c-3-1-6-.5-9 1.5m0-14v14M6 9l3 1m6 0 3-1M6 13l3 1m6 0 3-1" />
  ),
  stadium: (
    <path d="M3 9v7c0 2 4 4 9 4s9-2 9-4V9m-18 0c0-2 4-4 9-4s9 2 9 4-4 4-9 4-9-2-9-4Zm4 4v4m10-4v4m-7 3v-3h4v3" />
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3" />
      <path d="M5 21v-3a7 7 0 0 1 14 0v3z" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7a8 8 0 1 0 0 10M20 3v5h-5" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  shield: (
    <>
      <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
} satisfies Record<string, ReactNode>;

/** Uses local vector icons so administration controls remain available without remote fonts. */
export function AdminIcon({ name }: { name: keyof typeof shapes }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {shapes[name]}
    </svg>
  );
}
