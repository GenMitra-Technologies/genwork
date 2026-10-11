// src/features/admin/mentors/MentorsAdminPage.tsx
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Award, Mail, Building } from 'lucide-react';
import { adminApi } from '../api';
import { Avatar } from '../../../components/shared/Avatar';

export function MentorsAdminPage() {
  const { data: mentors = [], isLoading } = useQuery({
    queryKey: ['admin-mentors'],
    queryFn: adminApi.getMentors,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mentors & Supervisors</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Registered mentors, departmental divisions, and bios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mentors.map((mentor: any) => (
          <div
            key={mentor.id}
            className="rounded-xl border bg-card p-6 shadow-xs space-y-4 hover:border-primary/40 transition-all"
          >
            <div className="flex items-start gap-4">
              <Avatar
                src={mentor.profile?.avatar_url}
                name={mentor.profile?.full_name || 'Mentor'}
                size="lg"
              />
              <div className="space-y-1">
                <h3 className="font-bold text-base text-foreground">{mentor.profile?.full_name}</h3>
                <p className="text-xs text-muted-foreground">{mentor.profile?.email}</p>
                <span className="inline-flex rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {mentor.department}
                </span>
              </div>
            </div>

            {mentor.bio && (
              <p className="text-xs text-muted-foreground border-t pt-3 leading-relaxed">
                {mentor.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
