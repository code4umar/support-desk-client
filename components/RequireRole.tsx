'use client';
import Link from 'next/link';
import RequireAuth from '@/components/RequireAuth';
import { useAuth } from '@/lib/auth-context';
import type { Role } from '@/types';

// RequireAuth plus a role check. The API enforces the same rule; this just
// spares the user a form that would only end in a 403.
export default function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  return (
    <RequireAuth>
      <RoleGate roles={roles}>{children}</RoleGate>
    </RequireAuth>
  );
}

function RoleGate({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role as Role)) {
    return (
      <div className="mx-auto mt-16 max-w-md rounded-xl border border-line bg-surface p-8 text-center">
        <h1 className="text-lg font-bold text-navy">You don&apos;t have access to this page</h1>
        <p className="mt-2 text-sm text-muted">It&apos;s only available to {roles.join(' and ')} accounts.</p>
        <Link href="/dashboard" className="mt-5 inline-block rounded-md bg-brand px-4 py-2 text-sm font-semibold text-on-brand hover:bg-brand-dark">
          Back to dashboard
        </Link>
      </div>
    );
  }
  return <>{children}</>;
}
