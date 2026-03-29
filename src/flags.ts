import { flag } from 'flags/next';
import { vercelAdapter } from '@flags-sdk/vercel';

export const enableAutologFlag = flag({
  key: 'enable-autolog',
  description: 'Enable the Autolog feature',
  defaultValue: false,
  options: [
    { value: false, label: 'Disabled' },
    { value: true, label: 'Enabled' },
  ],
  adapter: vercelAdapter(),
});

export const visibleToolsFlag = flag<string>({
  key: 'visible-tools',
  description:
    'Controls which tools are shown in the sidebar. JSON array of tool URL paths. Empty string means show all.',
  defaultValue: '',
  options: [
    { value: '', label: 'All tools' },
    { value: '[]', label: 'No tools' },
  ],
  adapter: vercelAdapter(),
});
