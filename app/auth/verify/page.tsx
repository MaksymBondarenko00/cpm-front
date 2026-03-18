'use client';

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

import { VerifyPageContent } from '@/components/auth/verify-content';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
          <Card className="w-full max-w-md text-center">
            <CardHeader>
              <div className="mb-4 flex justify-center">
                <Loader2 className="h-16 w-16 animate-spin text-primary" />
              </div>
              <CardTitle>Loading...</CardTitle>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
