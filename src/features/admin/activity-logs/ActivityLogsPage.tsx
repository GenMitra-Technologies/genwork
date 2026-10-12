// src/features/admin/activity-logs/ActivityLogsPage.tsx
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Search, Shield, Eye } from 'lucide-react';
import { adminApi } from '../api';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { SearchInput } from '../../../components/shared/SearchInput';
import { formatDateTime } from '../../../lib/formatters';

export function ActivityLogsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['admin-activity-logs'],
    queryFn: adminApi.getActivityLogs,
  });

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.action?.toLowerCase().includes(q) ||
        log.entity_type?.toLowerCase().includes(q) ||
        log.role?.toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery]);

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Immutable Activity Logs</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Complete compliance audit trail of logins, state transitions, reviews, and administrative changes.
          </p>
        </div>

        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Filter by action or entity..."
          className="w-full sm:max-w-xs"
        />
      </div>

      <div className="rounded-xl border bg-card shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[640px]">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Role</th>
                <th className="p-4">Action</th>
                <th className="p-4">Entity Type</th>
                <th className="p-4">Entity ID</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLogs.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-4 whitespace-nowrap text-muted-foreground">
                    {formatDateTime(log.created_at)}
                  </td>
                  <td className="p-4">
                    <span className="capitalize font-mono px-2 py-0.5 rounded bg-muted text-[11px]">
                      {log.role || 'system'}
                    </span>
                  </td>
                  <td className="p-4 font-semibold text-foreground font-mono">{log.action}</td>
                  <td className="p-4 text-muted-foreground">{log.entity_type}</td>
                  <td className="p-4 font-mono text-[11px] text-muted-foreground truncate max-w-[120px]">
                    {log.entity_id || '—'}
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                      className="h-8 text-[11px] gap-1"
                    >
                      <Eye className="h-3.5 w-3.5" /> Inspect
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Diff Inspector Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogHeader>
          <DialogTitle className="font-mono text-sm">
            Log #{selectedLog?.id?.slice(0, 8)}: {selectedLog?.action}
          </DialogTitle>
          <DialogDescription>
            Recorded {formatDateTime(selectedLog?.created_at)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {selectedLog?.previous_value && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-destructive block">Previous Value:</span>
              <pre className="rounded bg-muted/60 p-3 text-[11px] font-mono overflow-x-auto text-foreground">
                {JSON.stringify(selectedLog.previous_value, null, 2)}
              </pre>
            </div>
          )}

          {selectedLog?.new_value && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-emerald-600 block">New Value:</span>
              <pre className="rounded bg-muted/60 p-3 text-[11px] font-mono overflow-x-auto text-foreground">
                {JSON.stringify(selectedLog.new_value, null, 2)}
              </pre>
            </div>
          )}

          {selectedLog?.metadata && Object.keys(selectedLog.metadata).length > 0 && (
            <div className="space-y-1">
              <span className="text-xs font-semibold text-muted-foreground block">Metadata:</span>
              <pre className="rounded bg-muted/60 p-3 text-[11px] font-mono overflow-x-auto text-foreground">
                {JSON.stringify(selectedLog.metadata, null, 2)}
              </pre>
            </div>
          )}

          {selectedLog?.user_agent && (
            <div className="text-[11px] text-muted-foreground">
              <strong>User Agent:</strong> {selectedLog.user_agent}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setSelectedLog(null)} className="w-full sm:w-auto min-h-[36px]">
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
