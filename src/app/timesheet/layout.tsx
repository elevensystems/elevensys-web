import type { Metadata } from 'next';

export const metadata: Metadata = {
  icons: {
    icon: '/jira-brands.svg',
  },
};

export default function TimesheetLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
