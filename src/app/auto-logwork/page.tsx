'use client';

import { useState } from 'react';

import { PlusCircle } from 'lucide-react';

import { NotConfiguredAlert } from '@/components/features/timesheet/not-configured-alert';
import { ConfigCard } from '@/components/features/auto-logwork/config-card';
import { ConfigForm } from '@/components/features/auto-logwork/config-form';
import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAutoLogwork } from '@/hooks/use-auto-logwork';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';
import type { AutoLogworkConfig } from '@/types/auto-logwork';

export default function AutoLogworkPage() {
  const { settings, isConfigured, isLoaded } = useTimesheetSettings();
  const { configs, isLoading, createConfig, updateConfig, deleteConfig, runConfig, canAddMore } =
    useAutoLogwork({
      username: settings.username,
      token: settings.token,
      isConfigured,
    });

  const [formOpen, setFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AutoLogworkConfig | undefined>();

  const handleEdit = (config: AutoLogworkConfig) => {
    setEditingConfig(config);
    setFormOpen(true);
  };

  const handleReauth = (config: AutoLogworkConfig) => {
    setEditingConfig(config);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditingConfig(undefined);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditingConfig(undefined);
  };

  const handleSave = async (payload: any) => {
    if (editingConfig) {
      return updateConfig(editingConfig.configId, payload);
    }
    return createConfig(payload);
  };

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-3xl mx-auto'>
          <ToolPageHeader
            title='Auto Logwork'
            description='Automatically log work to Jira on a weekly or monthly schedule.'
          />

          {isLoaded && !isConfigured && <NotConfiguredAlert />}

          {isLoaded && isConfigured && (
            <div className='space-y-6 mt-6'>
              {/* Header row */}
              <div className='flex items-center justify-between'>
                <p className='text-sm text-muted-foreground'>
                  {configs.length} / 3 configurations
                </p>
                <Button
                  onClick={handleAdd}
                  disabled={!canAddMore}
                  size='sm'
                >
                  <PlusCircle className='mr-1.5 h-4 w-4' />
                  Add Config
                </Button>
              </div>

              {/* Loading state */}
              {isLoading && (
                <div className='space-y-4'>
                  {[1, 2].map((i) => (
                    <Skeleton key={i} className='h-40 w-full rounded-lg' />
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!isLoading && configs.length === 0 && (
                <div className='rounded-lg border border-dashed p-10 text-center text-muted-foreground'>
                  <p className='text-sm'>No auto-logwork configurations yet.</p>
                  <p className='text-xs mt-1'>
                    Click &ldquo;Add Config&rdquo; to get started.
                  </p>
                </div>
              )}

              {/* Config cards */}
              {!isLoading && configs.length > 0 && (
                <div className='grid gap-4 sm:grid-cols-2'>
                  {configs.map((config) => (
                    <ConfigCard
                      key={config.configId}
                      config={config}
                      onEdit={handleEdit}
                      onDelete={deleteConfig}
                      onRun={runConfig}
                      onReauth={handleReauth}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => !open && handleFormClose()}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>
              {editingConfig
                ? editingConfig.status === 'paused_auth'
                  ? 'Re-authenticate'
                  : 'Edit Configuration'
                : 'New Auto-Logwork Configuration'}
            </DialogTitle>
          </DialogHeader>
          <ConfigForm
            settings={settings}
            editing={editingConfig}
            onSave={handleSave}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
