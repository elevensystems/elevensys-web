'use client';

import { memo, useCallback } from 'react';

import { ExternalLink, SquarePenIcon, Trash2 } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { ActionButton } from '@/components/action-button';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { ShortenedUrl } from '@/types/urlify';
import { getUrlStatus } from '@/types/urlify';

interface UrlRowProps {
  url: ShortenedUrl;
  isSelected: boolean;
  isDeleting: boolean;
  onToggleSelect: (shortCode: string) => void;
  onDelete: (shortCode: string) => void;
}

export const UrlRow = memo(function UrlRow({
  url,
  isSelected,
  isDeleting,
  onToggleSelect,
  onDelete,
}: UrlRowProps) {
  const status = getUrlStatus(url);
  const createdDate = new Date(url.createdAt).toLocaleDateString();

  const handleToggle = useCallback(
    () => onToggleSelect(url.shortCode),
    [url.shortCode, onToggleSelect]
  );

  const handleDelete = useCallback(
    () => onDelete(url.shortCode),
    [url.shortCode, onDelete]
  );

  return (
    <TableRow data-state={isSelected ? 'selected' : undefined}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={handleToggle}
          aria-label={`Select ${url.shortCode}`}
        />
      </TableCell>
      <TableCell className='font-mono text-sm'>
        <a
          href={url.shortUrl}
          target='_blank'
          rel='noopener noreferrer'
          className='inline-flex items-center gap-1 hover:underline text-primary'
        >
          {url.shortCode}
          <ExternalLink className='h-3 w-3' />
        </a>
      </TableCell>
      <TableCell className='max-w-[300px]'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='block truncate text-sm'>{url.originalUrl}</span>
            </TooltipTrigger>
            <TooltipContent side='bottom' className='max-w-[400px] break-all'>
              {url.originalUrl}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className='text-right font-medium'>{url.clicks}</TableCell>
      <TableCell>
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
          {status}
        </Badge>
      </TableCell>
      <TableCell className='text-nowrap text-sm'>{createdDate}</TableCell>
      <TableCell>
        <div className='flex items-center gap-1'>
          {isDeleting ? (
            <Spinner />
          ) : (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ActionButton
                      variant='ghost'
                      size='icon'
                      className='size-8'
                      disabled
                      leftIcon={<SquarePenIcon />}
                      aria-label='Edit'
                    />
                  </TooltipTrigger>
                  <TooltipContent>Edit (Coming soon)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AlertDialog>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <ActionButton
                          variant='ghost'
                          size='icon'
                          className='size-8 text-destructive hover:text-destructive'
                          leftIcon={<Trash2 />}
                          aria-label='Delete'
                        />
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Delete</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete URL</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the shortened URL{' '}
                      <span className='font-semibold font-mono'>
                        {url.shortCode}
                      </span>
                      ? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      variant='destructive'
                      onClick={handleDelete}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});
