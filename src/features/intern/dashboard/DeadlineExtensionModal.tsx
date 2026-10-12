// src/features/intern/dashboard/DeadlineExtensionModal.tsx
import React, { useState } from 'react';
import { Clock, AlertTriangle, Send, X, CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';

interface DeadlineExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  taskCode: string;
  currentDueDate?: string;
  mentorName?: string;
}

export function DeadlineExtensionModal({
  isOpen,
  onClose,
  taskTitle,
  taskCode,
  currentDueDate,
  mentorName = 'Assigned Mentor',
}: DeadlineExtensionModalProps) {
  const [reason, setReason] = useState('Technical blockers / Need mentor guidance');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-slate-200/90 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Request Deadline Extension</h3>
              <p className="text-xs text-slate-500 font-mono">{taskCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-slate-900">Extension Request Sent!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Your mentor ({mentorName}) has been notified with a 1-click <strong>[Grant +48h]</strong> approval action.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-200/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Task:</span>
                <strong className="text-slate-900 truncate max-w-[220px]">{taskTitle}</strong>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Requested Extension:</span>
                <span className="font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  +48 Hours
                </span>
              </div>
              {currentDueDate && (
                <div className="flex justify-between text-slate-600">
                  <span>Current Due Date:</span>
                  <span className="text-slate-700">{currentDueDate}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Reason for Request</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 shadow-2xs focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="Technical blockers / Need mentor guidance">
                  Technical blockers / Need mentor guidance
                </option>
                <option value="Architecture or schema refactor delay">
                  Architecture or schema refactor delay
                </option>
                <option value="External API / Sandbox dependency issue">
                  External API / Sandbox dependency issue
                </option>
                <option value="Personal / Health emergency">
                  Personal / Health emergency
                </option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-700">Additional Context / Details</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Briefly describe what you've completed and what is blocking final deliverable submission..."
                rows={3}
                className="text-xs"
                required
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-2.5 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                <Send className="h-3.5 w-3.5" /> Submit Request (+48h)
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
