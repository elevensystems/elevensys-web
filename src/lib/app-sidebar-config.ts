import {
  BadgeCheck,
  Braces,
  Clock,
  FileText,
  Home,
  Key,
  Languages,
  LifeBuoy,
  Link2,
  Link as LinkIcon,
  Music4,
  Package,
  ScrollText,
  Send,
  Sparkles,
} from 'lucide-react';

import type { ToolConfig } from '@/lib/tools-config';
import type { AuthUser } from '@/types/auth';

/**
 * Sidebar navigation and tools configuration
 */
export const appSidebarData = {
  user: null as AuthUser | null,
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: Home,
    },
    {
      title: 'Timesheet',
      url: '/timesheet',
      icon: Clock,
      isActive: true,
      items: [
        {
          title: 'Log Work',
          url: '/timesheet/logwork',
        },
        {
          title: 'My Worklogs',
          url: '/timesheet/worklogs',
        },
        {
          title: 'Configs',
          url: '/timesheet/config',
        },
      ],
    },
    {
      title: 'QA/SM Check (Soon)',
      url: '#',
      icon: BadgeCheck,
      isActive: false,
    },
    {
      title: 'Auto fetch tickets (Soon)',
      url: '#',
      icon: Sparkles,
      isActive: false,
    },
  ],
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
      onClick: 'support',
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
      onClick: 'feedback',
    },
  ],
  tools: [
    {
      name: 'Urlify',
      url: '/tools/urlify',
      icon: LinkIcon,
    },
    {
      name: 'JSON Diffinity',
      url: '/tools/json-diffinity',
      icon: Braces,
    },
    {
      name: 'JSON Objectify',
      url: '/tools/json-objectify',
      icon: Sparkles,
    },
    {
      name: 'Translately',
      url: '/tools/translately',
      icon: Languages,
      isPro: true,
    },
    {
      name: 'NPM Converter',
      url: '/tools/npm-converter',
      icon: Package,
    },
    {
      name: 'Passly',
      url: '/tools/passly',
      icon: Key,
    },
    {
      name: 'PR Link Shrinker',
      url: '/tools/pr-link-shrinker',
      icon: Link2,
    },
    {
      name: 'Summary Smith',
      url: '/tools/summary-smith',
      icon: FileText,
    },
    {
      name: 'Prompt Templates',
      url: '/tools/prompt-templates',
      icon: ScrollText,
      isPro: true,
    },
    {
      name: 'Beatly',
      url: '/tools/beatly',
      icon: Music4,
    },
  ] satisfies ToolConfig[],
};
