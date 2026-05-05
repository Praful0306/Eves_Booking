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
    <html lang="en" className="dark">
      <head>
        <title>Eves — Real-Time Seat Booking</title>
        <meta name="description" content="Zero double bookings. Atomic locks. Phantom lock recovery." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen bg-[#050508]">
        <QueryClientProvider client={queryClient}>
          <Navbar />
          <main>{children}</main>
          <Toaster
            theme="dark"
            richColors
            position="top-right"
            toastOptions={{
              style: { background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)', color: '#fff' },
            }}
          />
        </QueryClientProvider>
      </body>
    </html>
  );
}
