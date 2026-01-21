'use client';

import * as React from 'react';

import Link from 'next/link';

import {
  Braces,
  Command,
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
} from 'lucide-react';

import { FeedbackModal } from '@/components/layouts/feedback-modal';
import { NavMain } from '@/components/layouts/nav-main';
import { NavSecondary } from '@/components/layouts/nav-secondary';
import { NavTools } from '@/components/layouts/nav-tools';
import { NavUser } from '@/components/layouts/nav-user';
import { SupportModal } from '@/components/layouts/support-modal';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { AuthUser } from '@/types/auth';

const data = {
  user: null as AuthUser | null, // Set to null for guest, or provide user object when authenticated
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: Home,
    },
  ],
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
      onClick: 'support', // Custom handler identifier
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
      onClick: 'feedback', // Custom handler identifier
    },
  ],
  tools: [
    {
      name: 'URL Shortener',
      url: '/tools/url-shortener',
      icon: LinkIcon,
    },
    {
      name: 'JSON Diffinity',
      url: '/tools/json-diffinity',
      icon: Braces,
    },
    {
      name: 'AI Translator',
      url: '/tools/translate',
      icon: Languages,
    },
    {
      name: 'NPM Converter',
      url: '/tools/npm-converter',
      icon: Package,
    },
    {
      name: 'Password Generator',
      url: '/tools/password-generator',
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
    },
    {
      name: 'Song Recommender',
      url: '/tools/song-recommender',
      icon: Music4,
    },
  ],
};

const hasData = <T,>(data: T[] | undefined | null): boolean => {
  return Boolean(data && data.length > 0);
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: AuthUser | null;
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);
  const tools = data.tools;

  const handleNavAction = (action?: string) => {
    if (action === 'support') {
      setIsSupportModalOpen(true);
    } else if (action === 'feedback') {
      setIsFeedbackModalOpen(true);
    }
  };

  return (
    <>
      <Sidebar variant='floating' collapsible='icon' {...props}>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size='lg' asChild>
                <Link href='/'>
                  <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                    <Command className='size-4' />
                  </div>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>Eleven Systems</span>
                    <span className='truncate text-xs'>Trial</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {hasData(data.navMain) && <NavMain items={data.navMain} />}
          {hasData(tools) && <NavTools tools={tools} />}
          {hasData(data.navSecondary) && (
            <NavSecondary
              items={data.navSecondary}
              className='mt-auto'
              onItemClick={handleNavAction}
            />
          )}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={user} />
        </SidebarFooter>
      </Sidebar>
      <SupportModal
        open={isSupportModalOpen}
        onOpenChange={setIsSupportModalOpen}
      />
      <FeedbackModal
        open={isFeedbackModalOpen}
        onOpenChange={setIsFeedbackModalOpen}
      />
    </>
  );
}
