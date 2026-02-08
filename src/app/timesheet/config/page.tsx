'use client';

import { useCallback, useState } from 'react';

import Link from 'next/link';

import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Save,
  Settings as SettingsIcon,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect } from '@/components/ui/native-select';
import { useTimesheetSettings } from '@/hooks/use-timesheet-settings';

export default function TimesheetConfigPage() {
  const { settings, saveSettings, isConfigured, isLoaded } =
    useTimesheetSettings();

  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [jiraInstance, setJiraInstance] = useState<string>('jiradc');
  const [showToken, setShowToken] = useState(false);

  // Sync local form state with loaded settings
  const [initialized, setInitialized] = useState(false);
  if (isLoaded && !initialized) {
    setUsername(settings.username);
    setToken(settings.token);
    setJiraInstance(settings.jiraInstance || 'jiradc');
    setInitialized(true);
  }

  const hasChanges =
    initialized &&
    (username !== settings.username ||
      token !== settings.token ||
      jiraInstance !== settings.jiraInstance);

  const handleSave = useCallback(() => {
    if (!username.trim()) {
      toast.error('Username is required');
      return;
    }
    if (!token.trim()) {
      toast.error('Token is required');
      return;
    }
    saveSettings({
      username: username.trim(),
      token: token.trim(),
      jiraInstance,
    });
    toast.success('Settings saved successfully');
  }, [username, token, jiraInstance, saveSettings]);

  const handleClear = useCallback(() => {
    setUsername('');
    setToken('');
    setJiraInstance('jiradc');
    saveSettings({ username: '', token: '', jiraInstance: 'jiradc' });
    toast.success('Settings cleared');
  }, [saveSettings]);

  if (!isLoaded) {
    return (
      <MainLayout>
        <section className='container mx-auto px-4 py-12'>
          <div className='flex items-center justify-center h-40'>
            <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
          </div>
        </section>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-2xl mx-auto space-y-8'>
          <ToolPageHeader
            title='Timesheet Configurations'
            description='Configure your credentials to connect with Jira. These configs are stored locally in your browser.'
            infoMessage="Your credentials are stored only in your browser's local storage and are never sent to our servers — they are passed directly to the Jira API."
          />

          {/* Connection Status */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <SettingsIcon className='h-5 w-5' />
                Jira Connection
              </CardTitle>
              <CardAction>
                {isConfigured ? (
                  <Badge variant='secondary' className='gap-1.5'>
                    <span className='h-2 w-2 rounded-full bg-green-500' />
                    Connected
                  </Badge>
                ) : (
                  <Badge variant='destructive'>Not Configured</Badge>
                )}
              </CardAction>
              <CardDescription>
                Enter your Jira username, token, and select your Jira instance.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Username */}
              <div className='space-y-2'>
                <Label htmlFor='username'>Username</Label>
                <Input
                  id='username'
                  placeholder='e.g. ThaoLNP5'
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                />
                <p className='text-xs text-muted-foreground'>
                  Your Jira account username used for logging timesheets.
                </p>
              </div>

              {/* Token */}
              <div className='space-y-2'>
                <Label htmlFor='token'>Token</Label>
                <div className='relative'>
                  <Input
                    id='token'
                    type={showToken ? 'text' : 'password'}
                    placeholder='Your token'
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className='pr-10'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon-sm'
                    className='absolute right-1 top-1/2 -translate-y-1/2'
                    onClick={() => setShowToken(prev => !prev)}
                    aria-label={showToken ? 'Hide token' : 'Show token'}
                  >
                    {showToken ? (
                      <EyeOff className='h-4 w-4 text-muted-foreground' />
                    ) : (
                      <Eye className='h-4 w-4 text-muted-foreground' />
                    )}
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Token from for API authentication.
                </p>
              </div>

              {/* Jira Instance */}
              <div className='space-y-2'>
                <Label htmlFor='jira-instance'>Jira Instance</Label>
                <NativeSelect
                  id='jira-instance'
                  value={jiraInstance}
                  onChange={e => setJiraInstance(e.target.value)}
                >
                  <option value='jiradc'>jiradc</option>
                  <option value='jira3'>jira3</option>
                  <option value='jira9'>jira9</option>
                </NativeSelect>
                <p className='text-xs text-muted-foreground'>
                  Select the Jira instance your project is hosted on.
                </p>
              </div>
            </CardContent>
            <CardFooter className='flex justify-end gap-3'>
              <Button
                variant='outline'
                className='text-destructive hover:bg-destructive/10 hover:text-destructive'
                onClick={handleClear}
                disabled={!isConfigured}
              >
                <Trash2 className='h-4 w-4' />
                Clear Settings
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges && isConfigured}
              >
                {isConfigured && !hasChanges ? (
                  <Check className='h-4 w-4' />
                ) : (
                  <Save className='h-4 w-4' />
                )}
                {isConfigured && !hasChanges ? 'Saved' : 'Save Settings'}
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Navigation */}
          {isConfigured && (
            <div className='flex items-center justify-center gap-4'>
              <Button variant='outline' asChild>
                <Link href='/timesheet/logwork'>
                  <ArrowLeft className='h-4 w-4' />
                  Go to Log Work
                </Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href='/timesheet/worklogs'>
                  <ArrowLeft className='h-4 w-4' />
                  Go to My Worklogs
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
