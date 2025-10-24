// src/app/providers.tsx
'use client';

import { SessionProvider } from 'next-auth/react';

interface ProvidersProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: ProvidersProps) {
  return <SessionProvider>{children}</SessionProvider>;
}