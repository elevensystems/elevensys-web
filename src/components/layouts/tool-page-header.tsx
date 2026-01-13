interface ToolPageHeaderProps {
  title: string;
  description: string;
  infoMessage: string;
  error?: string;
}

export function ToolPageHeader({
  title,
  description,
  infoMessage,
  error,
}: ToolPageHeaderProps) {
  return (
    <>
      <div className='mb-8'>
        <h1 className='text-4xl font-semibold mb-2'>{title}</h1>
        <p className='text-muted-foreground'>{description}</p>
      </div>

      <div className='mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4'>
        <p className='text-sm text-blue-800'>🔒 {infoMessage}</p>
      </div>

      {error && (
        <div className='mb-4 rounded-lg border border-red-200 bg-red-50 p-4'>
          <p className='text-sm text-red-800'>{error}</p>
        </div>
      )}
    </>
  );
}
