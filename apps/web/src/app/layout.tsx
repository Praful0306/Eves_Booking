'use client';

import './globals.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
  }));

  return (
    <html lang="en">
      <head>
        <title>Eves — Real-Time Seat Booking</title>
        <meta name="description" content="Zero double bookings. Atomic locks. Phantom lock recovery." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-white text-slate-900 font-sans">
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <main className="pt-16">{children}</main>
          <Toaster
            theme="light"
            richColors
            position="top-right"
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
