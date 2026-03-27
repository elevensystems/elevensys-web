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
