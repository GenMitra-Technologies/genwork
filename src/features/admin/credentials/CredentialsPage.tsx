// src/features/admin/credentials/CredentialsPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, ShieldAlert, CheckCircle2, RotateCcw, UserX, UserCheck } from 'lucide-react';
import { adminApi } from '../api';
import { Avatar } from '../../../components/shared/Avatar';
import { SearchInput } from '../../../components/shared/SearchInput';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { formatDateTime } from '../../../lib/formatters';

export function CredentialsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [resetModalUser, setResetModalUser] = useState<any | null>(null);
  const [tempPasswordFeedback, setTempPasswordFeedback] = useState<string | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-credentials'],
    queryFn: adminApi.getCredentials,
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ userId, newStatus }: { userId: string; newStatus: 'active' | 'inactive' }) => {
      await adminApi.toggleUserStatus(userId, newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-credentials'] });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      await adminApi.resetPassword(userId);
    },
    onSuccess: () => {
      setTempPasswordFeedback('One-time password reset flag enabled. User will be forced to change password on next sign in.');
    },
  });

  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    });
  }, [users, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Logins & Account Credentials</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage account active states, enforce password rotations, and deactivate departed users.
          </p>
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Filter accounts by name or email..."
          className="w-full sm:max-w-xs"
        />
      </div>

      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[620px]">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Role</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Password State</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user: any) => {
                const isActive = user.status === 'active';
                return (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={user.avatar_url} name={user.full_name} size="sm" />
                        <div>
                          <p className="font-semibold text-foreground">{user.full_name}</p>
                          <p className="text-muted-foreground text-[11px]">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="capitalize font-medium text-foreground bg-muted px-2 py-0.5 rounded text-[11px]">
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isActive ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                        {isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {user.must_change_password ? (
                        <span className="text-amber-600 font-semibold flex items-center gap-1">
                          <RotateCcw className="h-3 w-3" /> Must change on login
                        </span>
                      ) : (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Verified
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setResetModalUser(user);
                            setTempPasswordFeedback(null);
                          }}
                          className="h-8 text-[11px]"
                        >
                          <KeyRound className="h-3 w-3 mr-1" /> Reset
                        </Button>

                        <Button
                          variant={isActive ? 'destructive' : 'default'}
                          size="sm"
                          onClick={() =>
                            toggleStatusMutation.mutate({
                              userId: user.id,
                              newStatus: isActive ? 'inactive' : 'active',
                            })
                          }
                          className="h-8 text-[11px]"
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetModalUser} onOpenChange={() => setResetModalUser(null)}>
        <DialogHeader>
          <DialogTitle>Reset User Password</DialogTitle>
          <DialogDescription>
            Enforce temporary password rotation for {resetModalUser?.full_name} ({resetModalUser?.email}).
          </DialogDescription>
        </DialogHeader>

        {tempPasswordFeedback ? (
          <div className="rounded border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
            {tempPasswordFeedback}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            This will flag the user profile to enforce immediate password replacement upon next sign-in.
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setResetModalUser(null)}>
            Close
          </Button>
          {!tempPasswordFeedback && (
            <Button
              onClick={() => resetPasswordMutation.mutate(resetModalUser.id)}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Processing...' : 'Confirm Reset Flag'}
            </Button>
          )}
        </DialogFooter>
      </Dialog>
    </div>
  );
}
