// src/features/intern/profile/CandidateOperationalProfileCard.tsx
import React from 'react';
import { CheckCircle2, Award, Building, User, Mail, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../../lib/utils';

interface CandidateProfileProps {
  intern?: any;
  internName?: string;
  candidateEmail?: string;
  rollId?: string;
  position?: string;
  department?: string;
  reportingManager?: string;
  startDate?: string;
  endDate?: string;
  workMode?: string;
  compensation?: string;
  profileCategory?: string;
  recruitmentClassification?: string;
  emergencyContact?: string;
  assignedMentorName?: string;
  assignedMentorId?: string;
  onboardingStatus?: string;
  className?: string;
}

export function CandidateOperationalProfileCard({
  intern,
  internName = intern?.full_name || intern?.profile?.full_name || 'SINDHU GANGISETTY',
  candidateEmail = intern?.email || intern?.profile?.email || 'sindhugangisetty910@gmail.com',
  rollId = intern?.roll_id || '24ht1a4346',
  position = intern?.role_title || 'FRONTEND DEVELOPER',
  department = intern?.department || 'Engineering',
  reportingManager = 'CTO',
  startDate = '2026-10-01',
  endDate = 'N/A',
  workMode = 'Remote',
  compensation = 'Unpaid',
  profileCategory = 'Student',
  recruitmentClassification = 'Student',
  emergencyContact = 'Gangisetty Srilatha (Elder sister)',
  assignedMentorName = intern?.mentor?.profile?.full_name || 'Kapu Mani Shankar Reddy',
  assignedMentorId = intern?.mentor_id || '10000000-0000-0000-0000-000000000001',
  onboardingStatus = 'Ready for Operations',
  className,
}: CandidateProfileProps) {
  return (
    <div className={cn('space-y-4 font-sans', className)}>
      {/* 1. Onboarding Readiness Evaluation Banner */}
      <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            ONBOARDING READINESS EVALUATION
          </span>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            {onboardingStatus}
          </span>
        </div>

        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800 flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium">
            All mandatory onboarding requirements approved. Intern active in daily operations.
          </span>
        </div>
      </div>

      {/* 2. Grid: Authoritative Offer Terms (Sealed) & Candidate Operational Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card: Authoritative Offer Terms (Sealed) */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3.5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2.5">
            AUTHORITATIVE OFFER TERMS (SEALED)
          </h3>

          <div className="space-y-2.5 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500">Position:</span>
              <span className="font-bold text-slate-900 uppercase tracking-tight">{position}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Department:</span>
              <span className="font-semibold text-slate-800">{department}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Reporting Manager:</span>
              <span className="font-semibold text-slate-800">{reportingManager}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Start Date:</span>
              <span className="font-mono text-slate-800">{startDate}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">End Date:</span>
              <span className="font-mono text-slate-800">{endDate}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Work Mode:</span>
              <span className="font-semibold text-slate-800">{workMode}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Compensation:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{compensation}</span>
            </div>
          </div>
        </div>

        {/* Right Card: Candidate Operational Profile */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs space-y-3.5">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide border-b border-slate-100 pb-2.5">
            CANDIDATE OPERATIONAL PROFILE
          </h3>

          <div className="space-y-2.5 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-500">Profile Category:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {profileCategory}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Recruitment Classification:</span>
              <span className="font-semibold text-slate-800">{recruitmentClassification}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 shrink-0">Candidate Email:</span>
              <span className="font-mono text-slate-900 font-medium truncate max-w-[180px] sm:max-w-none">{candidateEmail}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 shrink-0">Student / Roll ID:</span>
              <span className="font-mono font-semibold text-slate-900">{rollId}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500 shrink-0">Emergency Contact:</span>
              <span className="font-medium text-slate-800 truncate max-w-[180px] sm:max-w-none">{emergencyContact}</span>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-slate-500">Assigned Mentor:</span>
              <span className="font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer">
                {assignedMentorName}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
