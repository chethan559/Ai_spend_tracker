'use client';

import useAuthStore from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ApiKeyDisplay from '@/components/shared/ApiKeyDisplay';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="container-custom py-10">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold">
            Welcome{user?.email ? `, ${user.email}` : ''}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Dashboard coming soon...
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>API Key</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.apiKey ? (
              <ApiKeyDisplay
                apiKey={user.apiKey}
                description="Use this key to authenticate SDK requests."
              />
            ) : (
              <div className="rounded-md border bg-muted p-3 text-sm font-mono">
                No API key found
              </div>
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleLogout} variant="destructive">
                Log out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
