'use client';

import { ChevronLeft, ChevronRight, Link as LinkIcon, Loader2 } from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUrlifyAdmin } from '@/hooks/use-urlify-admin';

import { BulkDeleteAction } from './_components/bulk-delete-action';
import { UrlRow } from './_components/url-row';

export default function AdminUrlifyPage() {
  const {
    urls,
    isLoading,
    error,
    hasNextPage,
    hasPrevPage,
    goToNextPage,
    goToPrevPage,
    pageIndex,
    selectedIds,
    allSelected,
    someSelected,
    toggleSelectAll,
    toggleSelect,
    clearSelection,
    deletingId,
    isBulkDeleting,
    bulkDeleteProgress,
    handleDelete,
    handleBulkDelete,
  } = useUrlifyAdmin();

  return (
    <MainLayout>
      <section className='container mx-auto px-4 py-12'>
        <div className='max-w-full mx-auto space-y-8'>
          <ToolPageHeader
            title='Manage URLs'
            description='View and manage all shortened URLs.'
            error={error}
          />

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <LinkIcon className='h-5 w-5' />
                Shortened URLs
              </CardTitle>
              {urls.length > 0 && (
                <>
                  <CardDescription>
                    {urls.length} URL{urls.length !== 1 ? 's' : ''} on this
                    page
                  </CardDescription>
                  <BulkDeleteAction
                    selectedCount={selectedIds.size}
                    isBulkDeleting={isBulkDeleting}
                    bulkDeleteProgress={bulkDeleteProgress}
                    onBulkDelete={handleBulkDelete}
                    onClearSelection={clearSelection}
                  />
                </>
              )}
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className='flex items-center justify-center h-40'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                </div>
              ) : urls.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-40 text-muted-foreground'>
                  <p>No shortened URLs found.</p>
                </div>
              ) : (
                <>
                  <div className='rounded-md border'>
                    <Table>
                      <TableHeader className='bg-muted/50'>
                        <TableRow>
                          <TableHead className='w-[40px]'>
                            <Checkbox
                              checked={
                                allSelected
                                  ? true
                                  : someSelected
                                    ? 'indeterminate'
                                    : false
                              }
                              onCheckedChange={toggleSelectAll}
                              aria-label='Select all'
                            />
                          </TableHead>
                          <TableHead>Short Code</TableHead>
                          <TableHead>Original URL</TableHead>
                          <TableHead className='text-right'>Clicks</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className='w-[60px]' />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {urls.map(url => (
                          <UrlRow
                            key={url.shortCode}
                            url={url}
                            isSelected={selectedIds.has(url.shortCode)}
                            isDeleting={deletingId === url.shortCode}
                            onToggleSelect={toggleSelect}
                            onDelete={handleDelete}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className='flex items-center justify-between mt-4'>
                    <span className='text-sm text-muted-foreground'>
                      Page {pageIndex + 1}
                    </span>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={!hasPrevPage || isLoading}
                        onClick={goToPrevPage}
                      >
                        <ChevronLeft className='h-4 w-4' />
                        Previous
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={!hasNextPage || isLoading}
                        onClick={goToNextPage}
                      >
                        Next
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
