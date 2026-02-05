import MainLayout from '@/components/layouts/main-layout';

export default function Home() {
  return (
    <MainLayout>
      <div className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto'>
          <h1 className='text-4xl font-bold mb-4'>Welcome to Eleven Systems</h1>
          <p className='text-lg text-muted-foreground mb-6'>
            Your workspace for managing tools and projects efficiently.
          </p>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            <div className='bg-card p-6 rounded-lg border'>
              <h3 className='font-semibold mb-2'>Get Started</h3>
              <p className='text-sm text-muted-foreground'>
                Explore our tools and features to enhance your productivity.
              </p>
            </div>
            <div className='bg-card p-6 rounded-lg border'>
              <h3 className='font-semibold mb-2'>Documentation</h3>
              <p className='text-sm text-muted-foreground'>
                Learn how to make the most of our platform.
              </p>
            </div>
            <div className='bg-card p-6 rounded-lg border'>
              <h3 className='font-semibold mb-2'>Support</h3>
              <p className='text-sm text-muted-foreground'>
                Need help? Our team is here to assist you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
