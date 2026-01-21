'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ApiKeyDisplay from '@/components/shared/ApiKeyDisplay';
import PasswordStrength from './PasswordStrength';
import useAuthStore from '@/store/authStore';
import { signup } from '@/lib/api';
import { signupSchema, type SignupInput } from '@/lib/validations';

export default function SignupForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: SignupInput) => {
    setIsLoading(true);
    try {
      const response = await signup(values.email, values.password);
      setApiKey(response.apiKey);
      setUser(response.user);
      setShowApiKeyDialog(true);
      toast.success('Account created');
    } catch (error) {
      const message =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        (error instanceof Error ? error.message : 'Signup failed');
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    setShowApiKeyDialog(false);
    router.push('/login');
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </FormControl>
                <PasswordStrength password={field.value} />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    autoComplete="new-password"
                    placeholder="••••••••"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              'Create account'
            )}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </Form>

      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent
          onEscapeKeyDown={(event) => event.preventDefault()}
          onPointerDownOutside={(event) => event.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Your API key</DialogTitle>
            <DialogDescription>
              Use this key to authenticate SDK requests.
            </DialogDescription>
          </DialogHeader>

          <ApiKeyDisplay
            apiKey={apiKey ?? ''}
            description="Store this key securely in your app configuration."
          />

          <p className="text-sm text-muted-foreground">
            Save this key securely. You won&apos;t see it again!
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button type="button" onClick={handleContinue}>
              Continue to login
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
