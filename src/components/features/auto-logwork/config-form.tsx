'use client';

import { useCallback, useEffect, useState } from 'react';

import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import type {
  AutoLogworkConfig,
  AutoLogworkTicket,
  CreateAutoLogworkConfigPayload,
  UpdateAutoLogworkConfigPayload,
} from '@/types/auto-logwork';
import { DAY_NAMES, HOUR_OPTIONS } from '@/types/auto-logwork';
import type { TimesheetSettings } from '@/types/timesheet';

import { TicketRow } from './ticket-row';

interface JiraProject {
  id: string;
  key: string;
  name: string;
}

interface ConfigFormProps {
  settings: TimesheetSettings;
  editing?: AutoLogworkConfig;
  onSave: (
    payload: CreateAutoLogworkConfigPayload | UpdateAutoLogworkConfigPayload
  ) => Promise<boolean>;
  onCancel: () => void;
}

const DEFAULT_TICKETS: AutoLogworkTicket[] = [{ issueKey: '', hours: 8 }];

export function ConfigForm({
  settings,
  editing,
  onSave,
  onCancel,
}: ConfigFormProps) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1 — Project
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState<JiraProject | null>(
    editing
      ? {
          id: editing.projectId,
          key: editing.projectKey,
          name: editing.projectName,
        }
      : null
  );

  // Step 2 — Tickets
  const [tickets, setTickets] = useState<AutoLogworkTicket[]>(
    editing?.tickets ?? DEFAULT_TICKETS
  );

  // Step 3 — Schedule
  const [scheduleType, setScheduleType] = useState<'weekly' | 'monthly'>(
    editing?.schedule.type ?? 'weekly'
  );
  const [dayOfWeek, setDayOfWeek] = useState(editing?.schedule.dayOfWeek ?? 5); // Friday
  const [dayOfMonth, setDayOfMonth] = useState(editing?.schedule.dayOfMonth ?? 1);
  const [hour, setHour] = useState(editing?.schedule.hour ?? 9);

  // Step 4 — Email
  const [email, setEmail] = useState(
    editing?.email ?? `${settings.username}@fpt.com`
  );

  // Load projects on mount
  useEffect(() => {
    if (!settings.token) return;
    setIsLoadingProjects(true);
    fetch('/api/timesheet/projects', {
      headers: {
        Authorization: `Bearer ${settings.token}`,
        'Content-Type': 'application/json',
      },
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.success && Array.isArray(result.data)) {
          setProjects(
            result.data.map((p: any) => ({
              id: p.id,
              key: p.key,
              name: p.name,
            }))
          );
        }
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setIsLoadingProjects(false));
  }, [settings.token]);

  const handleTicketChange = useCallback(
    (index: number, field: keyof AutoLogworkTicket, value: string | number) => {
      setTickets((prev) =>
        prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
      );
    },
    []
  );

  const handleAddTicket = useCallback(() => {
    setTickets((prev) => [...prev, { issueKey: '', hours: 8 }]);
  }, []);

  const handleRemoveTicket = useCallback((index: number) => {
    setTickets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = async () => {
    if (!selectedProject) {
      toast.error('Please select a project');
      return;
    }
    const validTickets = tickets.filter((t) => t.issueKey.trim());
    if (validTickets.length === 0) {
      toast.error('Please add at least one ticket');
      return;
    }
    if (validTickets.some((t) => t.hours <= 0)) {
      toast.error('All tickets must have hours > 0');
      return;
    }

    const schedule =
      scheduleType === 'weekly'
        ? { type: 'weekly' as const, dayOfWeek, hour }
        : { type: 'monthly' as const, dayOfMonth, hour };

    const payload: CreateAutoLogworkConfigPayload = {
      username: settings.username,
      email,
      jiraInstance: settings.jiraInstance,
      projectId: selectedProject.id,
      projectKey: selectedProject.key,
      projectName: selectedProject.name,
      tickets: validTickets,
      schedule,
    };

    setIsSaving(true);
    const ok = await onSave(payload);
    setIsSaving(false);
    if (ok) onCancel();
  };

  return (
    <div className='space-y-6'>
      {/* Step indicators */}
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        {['Project', 'Tickets', 'Schedule', 'Email'].map((label, i) => (
          <span
            key={label}
            className={`px-2 py-0.5 rounded ${step === i + 1 ? 'bg-primary text-primary-foreground' : ''}`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>

      {/* Step 1: Project */}
      {step === 1 && (
        <div className='space-y-3'>
          <Label>Select Project</Label>
          {isLoadingProjects ? (
            <p className='text-sm text-muted-foreground'>Loading projects…</p>
          ) : (
            <NativeSelect
              value={selectedProject?.id ?? ''}
              onChange={(e) => {
                const p = projects.find((x) => x.id === e.target.value);
                setSelectedProject(p ?? null);
              }}
            >
              <option value=''>— Choose a project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.key}] {p.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </div>
      )}

      {/* Step 2: Tickets */}
      {step === 2 && (
        <div className='space-y-3'>
          <Label>Tickets</Label>
          <p className='text-xs text-muted-foreground'>
            Add tickets to log work for. Hours are logged per missing date.
          </p>
          <div className='space-y-2'>
            {tickets.map((t, i) => (
              <TicketRow
                key={i}
                ticket={t}
                index={i}
                onChange={handleTicketChange}
                onRemove={handleRemoveTicket}
              />
            ))}
          </div>
          <Button variant='outline' size='sm' onClick={handleAddTicket}>
            <PlusCircle className='mr-1 h-4 w-4' />
            Add Ticket
          </Button>
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <div className='space-y-4'>
          <Label>Schedule</Label>
          <div className='space-y-3'>
            <div>
              <Label className='text-xs text-muted-foreground'>Frequency</Label>
              <NativeSelect
                value={scheduleType}
                onChange={(e) =>
                  setScheduleType(e.target.value as 'weekly' | 'monthly')
                }
              >
                <option value='weekly'>Weekly</option>
                <option value='monthly'>Monthly</option>
              </NativeSelect>
            </div>

            {scheduleType === 'weekly' ? (
              <div>
                <Label className='text-xs text-muted-foreground'>Day of week</Label>
                <NativeSelect
                  value={String(dayOfWeek)}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                >
                  {DAY_NAMES.map((name, i) => (
                    <option key={i} value={i}>
                      {name}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            ) : (
              <div>
                <Label className='text-xs text-muted-foreground'>Day of month</Label>
                <Input
                  type='number'
                  min={1}
                  max={28}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                />
                <p className='text-xs text-muted-foreground mt-1'>Max 28 to work in all months</p>
              </div>
            )}

            <div>
              <Label className='text-xs text-muted-foreground'>Time (UTC)</Label>
              <NativeSelect
                value={String(hour)}
                onChange={(e) => setHour(Number(e.target.value))}
              >
                {HOUR_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Email */}
      {step === 4 && (
        <div className='space-y-3'>
          <Label>Notification Email</Label>
          <p className='text-xs text-muted-foreground'>
            Confirmation emails will be sent here after each auto-logwork run.
          </p>
          <Input
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder='your.name@fpt.com'
          />
        </div>
      )}

      {/* Navigation */}
      <div className='flex justify-between pt-2'>
        <Button variant='outline' onClick={step === 1 ? onCancel : () => setStep((s) => s - 1)}>
          {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        {step < 4 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 && !selectedProject}
          >
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Saving…' : editing ? 'Update' : 'Create'}
          </Button>
        )}
      </div>
    </div>
  );
}
