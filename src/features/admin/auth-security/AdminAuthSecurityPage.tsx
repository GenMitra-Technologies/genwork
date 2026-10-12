// src/features/admin/auth-security/AdminAuthSecurityPage.tsx
import React, { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  Mail,
  Lock,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  LogOut,
  Clock,
  ShieldAlert,
  Key,
  Info,
  Check,
  X,
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { cn } from '../../../lib/utils';

export function AdminAuthSecurityPage() {
  // Primary email state
  const [primaryEmail, setPrimaryEmail] = useState('ops@genmitra.com');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState('');

  // Password state
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Security PIN & Step-Up verification state
  const [isPinConfigured, setIsPinConfigured] = useState(true);
  const [stepUpActive, setStepUpActive] = useState(true);
  const [validityWindow, setValidityWindow] = useState('15 Minutes');
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');

  // Session state
  const [sessionsSignedOut, setSessionsSignedOut] = useState(false);
  const [verificationsRevoked, setVerificationsRevoked] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  const handleChangeEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmailInput.trim()) {
      setPrimaryEmail(newEmailInput.trim());
      setEmailModalOpen(false);
      setNewEmailInput('');
      showFeedback('Primary account email updated successfully!');
    }
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length >= 8 && newPassword === confirmPassword) {
      setPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showFeedback('Login password changed successfully!');
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.length >= 6 && pinInput === confirmPinInput) {
      setIsPinConfigured(true);
      setPinModalOpen(false);
      setPinInput('');
      setConfirmPinInput('');
      showFeedback('Security PIN updated successfully!');
    }
  };

  const handleDisablePin = () => {
    setIsPinConfigured(false);
    showFeedback('Security PIN disabled. Administrator password will be required for step-up actions.');
  };

  const handleSignOutOtherSessions = () => {
    setSessionsSignedOut(true);
    showFeedback('All other active device sessions have been revoked.');
  };

  const handleRevokeVerifications = () => {
    setVerificationsRevoked(true);
    showFeedback('All active step-up authorizations have been revoked immediately.');
    setTimeout(() => setVerificationsRevoked(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <ShieldCheck className="h-6 w-6 text-indigo-600" /> Authentication & Credentials
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Manage your account login credentials, primary email address, and password security.
        </p>
      </div>

      {feedbackMessage && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* 1. Account Credentials Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-indigo-600" /> Account Sign-In & Security
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Primary email address and password protecting your administrative privileges.
          </p>
        </div>

        <div className="divide-y divide-slate-100 space-y-4">
          {/* Primary Email */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                Primary Account Email
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold font-mono text-slate-900">{primaryEmail}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <Check className="h-2.5 w-2.5" /> Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Used for sign-in, recovery links, and transactional security notices.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setNewEmailInput(primaryEmail);
                setEmailModalOpen(true);
              }}
              className="text-xs h-8 shrink-0"
            >
              Change Email Address
            </Button>
          </div>

          {/* Login Password */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
                Login Password
              </span>
              <p className="text-sm font-mono tracking-widest text-slate-900">••••••••••••</p>
              <p className="text-[11px] text-slate-500">
                Strong passwords must contain at least 8 characters.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPasswordModalOpen(true)}
              className="text-xs h-8 shrink-0"
            >
              Change Password
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Active Sessions Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <Laptop className="h-4 w-4 text-indigo-600" /> Active Sessions
          </h2>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Manage active sessions across your devices. Sign out other sessions if you suspect unauthorized access.
          </p>
        </div>

        <div className="space-y-3">
          {/* Current Session Item */}
          <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/50 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Laptop className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">Current Session</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Active Now
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  This browser window · Windows PC · Last accessed moments ago
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOutOtherSessions}
              className="text-xs h-8"
            >
              Sign Out Other Sessions
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                showFeedback('Revoking all active sessions and redirecting...');
                setTimeout(() => {
                  window.location.href = '/genmitraworkspace';
                }, 1000);
              }}
              className="text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Sign Out Everywhere
            </Button>
          </div>
        </div>
      </div>

      {/* 3. Step-Up Sensitive Action Verification Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs space-y-5">
        <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-indigo-600" /> Step-Up Sensitive Action Verification
              </h2>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Action-bound re-authentication for critical operations (offer dispatch, rejections, and credential updates).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Security PIN Box */}
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
              Security PIN
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">
                {isPinConfigured ? 'Configured (PIN & Password Allowed)' : 'Not Configured'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              6 to 8 digit per-administrator PIN for convenient sensitive action approvals.
            </p>
          </div>

          {/* Action Validity Window */}
          <div className="rounded-xl border border-slate-200/70 bg-slate-50/40 p-4 space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide block">
              Action Validity Window
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-indigo-600 font-mono">{validityWindow}</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Authorizations are bound to specific actions and target IDs.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPinModalOpen(true)}
            className="text-xs h-8"
          >
            Change Security PIN
          </Button>

          {isPinConfigured && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisablePin}
              className="text-xs h-8 text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              Disable PIN
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleRevokeVerifications}
            className="text-xs h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            Revoke Current Verifications
          </Button>
        </div>
      </div>

      {/* Change Email Dialog */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogHeader>
          <DialogTitle>Update Primary Email Address</DialogTitle>
          <DialogDescription>
            Enter your new email address. A verification link will be dispatched to confirm ownership.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleChangeEmail} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-900">New Email Address</label>
            <Input
              type="email"
              value={newEmailInput}
              onChange={(e) => setNewEmailInput(e.target.value)}
              placeholder="e.g. ops@genmitra.com"
              required
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEmailModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
              Save Email
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogHeader>
          <DialogTitle>Change Login Password</DialogTitle>
          <DialogDescription>
            Enter your current password and establish a new password with at least 8 characters.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-900">Current Password</label>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-900">New Password (Min 8 chars)</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={8}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-900">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="text-xs"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={newPassword.length < 8 || newPassword !== confirmPassword}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Update Password
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Security PIN Dialog */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogHeader>
          <DialogTitle>Set Administrator Security PIN</DialogTitle>
          <DialogDescription>
            Configure a 6 to 8 digit PIN for rapid authorization of step-up administrative actions.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleChangePin} className="space-y-3 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-slate-900">6-8 Digit PIN</label>
            <Input
              type="password"
              maxLength={8}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              required
              className="text-xs font-mono tracking-widest text-center"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-900">Confirm PIN</label>
            <Input
              type="password"
              maxLength={8}
              value={confirmPinInput}
              onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              required
              className="text-xs font-mono tracking-widest text-center"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => setPinModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pinInput.length < 6 || pinInput !== confirmPinInput}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Save PIN
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
