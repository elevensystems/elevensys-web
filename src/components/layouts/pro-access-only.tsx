import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import MainLayout from './main-layout';
import { ToolPageHeader } from './tool-page-header';

interface ProAccessOnlyProps {
  title: string;
  description: string;
  toolName?: string;
  message?: string;
}

export default function ProAccessOnly({
  title,
  description,
  toolName,
  message,
}: ProAccessOnlyProps) {
  const resolvedToolName = toolName || title;
  const resolvedMessage =
    message ||
    `This tool is available to Pro users only. Upgrade your plan to unlock ${resolvedToolName}.`;

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-3xl mx-auto space-y-6'>
          <ToolPageHeader title={title} description={description} />
          <Alert className='border-dashed'>
            <AlertTitle>Pro access required</AlertTitle>
            <AlertDescription>{resolvedMessage}</AlertDescription>
          </Alert>
        </div>
      </section>
    </MainLayout>
  );
}
