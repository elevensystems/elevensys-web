import { DashboardLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold mb-2'>Dashboard</h1>
          <p className='text-muted-foreground'>
            Manage your shortened URLs and view analytics
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='p-6 border border-border rounded-lg'>
            <h3 className='text-sm font-medium text-muted-foreground mb-2'>
              Total Links
            </h3>
            <p className='text-3xl font-bold'>127</p>
          </div>
          <div className='p-6 border border-border rounded-lg'>
            <h3 className='text-sm font-medium text-muted-foreground mb-2'>
              Total Clicks
            </h3>
            <p className='text-3xl font-bold'>3,542</p>
          </div>
          <div className='p-6 border border-border rounded-lg'>
            <h3 className='text-sm font-medium text-muted-foreground mb-2'>
              Active This Month
            </h3>
            <p className='text-3xl font-bold'>89</p>
          </div>
        </div>

        <div className='border border-border rounded-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>Recent Links</h2>
          <div className='space-y-3'>
            <div className='flex items-center justify-between p-3 bg-muted rounded-md'>
              <div>
                <p className='font-medium text-sm'>short.link/abc123</p>
                <p className='text-xs text-muted-foreground'>
                  https://example.com/very-long-url...
                </p>
              </div>
              <Button size='sm' variant='outline'>
                View
              </Button>
            </div>
            <div className='flex items-center justify-between p-3 bg-muted rounded-md'>
              <div>
                <p className='font-medium text-sm'>short.link/xyz789</p>
                <p className='text-xs text-muted-foreground'>
                  https://example.com/another-long-url...
                </p>
              </div>
              <Button size='sm' variant='outline'>
                View
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
