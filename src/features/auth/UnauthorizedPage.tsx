// src/features/auth/UnauthorizedPage.tsx
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';

export function UnauthorizedPage() {
  const { role, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const getHomePath = () => {
    if (role === 'intern') return '/intern';
    if (role === 'mentor') return '/mentor';
    if (role === 'admin') return '/admin';
    return '/';
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-muted/30">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Access Restricted</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your current account role (<span className="font-semibold capitalize text-foreground">{role || 'unassigned'}</span>)
          does not have clearance to view this resource.
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <Button asChild className="w-full">
            <Link to={getHomePath()}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Return to My Workspace
            </Link>
          </Button>

          <Button variant="outline" onClick={handleSignOut} className="w-full">
            <LogOut className="mr-2 h-4 w-4" /> Switch Account
          </Button>
        </div>
      </div>
    </div>
  );
}
