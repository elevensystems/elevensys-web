export interface DomainConfig {
  appName: string;
  description: string;
  showTools: boolean;
}

const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  'satio.dev': {
    appName: 'Jirassic World',
    description: 'Your Jira Timesheet Companion',
    showTools: false,
  },
  'elevensystems.dev': {
    appName: 'Eleven Systems',
    description: 'Connecting Ideas, Building Solutions',
    showTools: true,
  },
};

const DEFAULT_CONFIG: DomainConfig = DOMAIN_CONFIGS['elevensystems.dev'];

export function getDomainConfig(hostname: string): DomainConfig {
  const bare = hostname.split(':')[0];
  return DOMAIN_CONFIGS[bare] ?? DEFAULT_CONFIG;
}
