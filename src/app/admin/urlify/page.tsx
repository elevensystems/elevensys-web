'use client';

import { Link as LinkIcon } from 'lucide-react';

import MainLayout from '@/components/layouts/main-layout';
import { ToolPageHeader } from '@/components/layouts/tool-page-header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useUrlifyAdmin } from '@/hooks/use-urlify-admin';
import type { PageSizeOption } from '@/hooks/use-urlify-admin';

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
    goToPage,
    pageIndex,
    totalPages,
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
    pageSize,
    setPageSize,
    pageSizeOptions,
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
                    {urls.length} URL{urls.length !== 1 ? 's' : ''} on this page
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
                <div className='overflow-hidden rounded-lg border'>
                  <Table>
                    <TableHeader className='bg-muted/50 top-0 z-10'>
                      <TableRow>
                        <TableHead className='w-[40px]'>
                          <Skeleton className='h-4 w-4' />
                        </TableHead>
                        <TableHead>Short Code</TableHead>
                        <TableHead>Original URL</TableHead>
                        <TableHead className='text-right'>Clicks</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className='w-[60px]'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.from({ length: pageSize }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Skeleton className='h-4 w-4' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-20' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-48' />
                          </TableCell>
                          <TableCell className='text-right'>
                            <Skeleton className='h-4 w-8 ml-auto' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-5 w-16 rounded-full' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-4 w-24' />
                          </TableCell>
                          <TableCell>
                            <Skeleton className='h-8 w-8 rounded-md' />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : urls.length === 0 ? (
                <div className='flex flex-col items-center justify-center h-40 text-muted-foreground'>
                  <p>No shortened URLs found.</p>
                </div>
              ) : (
                <>
                  <div className='overflow-hidden rounded-lg border'>
                    <Table>
                      <TableHeader className='bg-muted/50 top-0 z-10'>
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
                          <TableHead className='w-[60px]'>Actions</TableHead>
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
                    <div className='flex items-center gap-2'>
                      <span className='text-sm text-muted-foreground'>
                        Rows per page
                      </span>
                      <Select
                        value={String(pageSize)}
                        onValueChange={value =>
                          setPageSize(Number(value) as PageSizeOption)
                        }
                      >
                        <SelectTrigger className='w-[70px] h-8'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pageSizeOptions.map(size => (
                            <SelectItem key={size} value={String(size)}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Pagination className='mx-0 w-auto'>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={
                              hasPrevPage && !isLoading
                                ? goToPrevPage
                                : undefined
                            }
                            aria-disabled={!hasPrevPage || isLoading}
                            className={
                              !hasPrevPage || isLoading
                                ? 'pointer-events-none opacity-50'
                                : 'cursor-pointer'
                            }
                          />
                        </PaginationItem>
                        {Array.from({ length: totalPages }).map((_, i) => {
                          // Show first page, last page, current page, and neighbors
                          const isFirst = i === 0;
                          const isLast = i === totalPages - 1;
                          const isNearCurrent = Math.abs(i - pageIndex) <= 1;

                          if (!isFirst && !isLast && !isNearCurrent) {
                            // Show ellipsis only once for each gap
                            const prevShown =
                              i === 1
                                ? true
                                : i - 1 === 0 ||
                                  i - 1 === totalPages - 1 ||
                                  Math.abs(i - 1 - pageIndex) <= 1;
                            if (prevShown) {
                              return (
                                <PaginationItem key={i}>
                                  <PaginationEllipsis />
                                </PaginationItem>
                              );
                            }
                            return null;
                          }

                          return (
                            <PaginationItem key={i}>
                              <PaginationLink
                                isActive={i === pageIndex}
                                onClick={() => goToPage(i)}
                                className='cursor-pointer'
                              >
                                {i + 1}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}
                        <PaginationItem>
                          <PaginationNext
                            onClick={
                              hasNextPage && !isLoading
                                ? goToNextPage
                                : undefined
                            }
                            aria-disabled={!hasNextPage || isLoading}
                            className={
                              !hasNextPage || isLoading
                                ? 'pointer-events-none opacity-50'
                                : 'cursor-pointer'
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
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
