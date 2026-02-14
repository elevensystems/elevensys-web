'use client';

import * as React from 'react';

import Link from 'next/link';

import { Egg } from 'lucide-react';

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
import { useDomain } from '@/contexts/domain-context';
import { appSidebarData } from '@/lib/app-sidebar-config';
import type { AuthUser } from '@/types/auth';

const hasData = <T,>(data: T[] | undefined | null): boolean => {
  return Boolean(data && data.length > 0);
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: AuthUser | null;
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);
  const domainConfig = useDomain();
  const tools = appSidebarData.tools;

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
                    <Egg className='size-4' />
                  </div>
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-medium'>
                      {domainConfig.appName}
                    </span>
                    <span className='truncate text-xs'>Version 5.3.2</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {hasData(appSidebarData.navMain) && (
            <NavMain
              items={appSidebarData.navMain}
              isAdmin={user?.role === 'admin'}
            />
          )}
          {domainConfig.showTools && hasData(tools) && (
            <NavTools tools={tools} />
          )}
          {hasData(appSidebarData.navSecondary) && (
            <NavSecondary
              items={appSidebarData.navSecondary}
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
