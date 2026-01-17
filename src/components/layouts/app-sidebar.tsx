'use client';

import * as React from 'react';

import Link from 'next/link';

import {
  //   BookOpen,
  //   Bot,
  Braces,
  Command,
  FileText,
  //   Frame,
  Home,
  Key,
  Languages,
  LifeBuoy,
  Link2,
  Link as LinkIcon,
  //   Map,
  Music4,
  Package,
  ScrollText,
  //   Settings2,
  //   SquareTerminal,
  //   PieChart,
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

const data = {
  user: null as {
    name: string;
    email: string;
    avatar: string;
  } | null, // Set to null for guest, or provide user object when authenticated
  navMain: [
    {
      title: 'Home',
      url: '/',
      icon: Home,
    },
    //     {
    //       title: "Playground",
    //       url: "#",
    //       icon: SquareTerminal,
    //       isActive: true,
    //       items: [
    //         {
    //           title: "History",
    //           url: "#",
    //         },
    //         {
    //           title: "Starred",
    //           url: "#",
    //         },
    //         {
    //           title: "Settings",
    //           url: "#",
    //         },
    //       ],
    //     },
    //     {
    //       title: "Models",
    //       url: "#",
    //       icon: Bot,
    //       items: [
    //         {
    //           title: "Genesis",
    //           url: "#",
    //         },
    //         {
    //           title: "Explorer",
    //           url: "#",
    //         },
    //         {
    //           title: "Quantum",
    //           url: "#",
    //         },
    //       ],
    //     },
    //     {
    //       title: "Documentation",
    //       url: "#",
    //       icon: BookOpen,
    //       items: [
    //         {
    //           title: "Introduction",
    //           url: "#",
    //         },
    //         {
    //           title: "Get Started",
    //           url: "#",
    //         },
    //         {
    //           title: "Tutorials",
    //           url: "#",
    //         },
    //         {
    //           title: "Changelog",
    //           url: "#",
    //         },
    //       ],
    //     },
    //     {
    //       title: "Settings",
    //       url: "#",
    //       icon: Settings2,
    //       items: [
    //         {
    //           title: "General",
    //           url: "#",
    //         },
    //         {
    //           title: "Team",
    //           url: "#",
    //         },
    //         {
    //           title: "Billing",
    //           url: "#",
    //         },
    //         {
    //           title: "Limits",
    //           url: "#",
    //         },
    //       ],
    //     },
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
    // {
    //   name: "Design Engineering",
    //   url: "#",
    //   icon: Frame,
    // },
    // {
    //   name: "Sales & Marketing",
    //   url: "#",
    //   icon: PieChart,
    // },
    // {
    //   name: "Travel",
    //   url: "#",
    //   icon: Map,
    // },
  ],
};

const hasData = <T,>(data: T[] | undefined | null): boolean => {
  return Boolean(data && data.length > 0);
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isSupportModalOpen, setIsSupportModalOpen] = React.useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = React.useState(false);

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
                    <span className='truncate text-xs'>Premium</span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          {hasData(data.navMain) && <NavMain items={data.navMain} />}
          {hasData(data.tools) && <NavTools tools={data.tools} />}
          {hasData(data.navSecondary) && (
            <NavSecondary
              items={data.navSecondary}
              className='mt-auto'
              onItemClick={handleNavAction}
            />
          )}
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
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
