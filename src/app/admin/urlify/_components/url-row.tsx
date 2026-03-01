'use client';

import { memo, useCallback } from 'react';

import { ExternalLink, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
        <AlertDialog>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='icon'
                className='h-8 w-8'
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Spinner />
                ) : (
                  <MoreHorizontal className='h-4 w-4' />
                )}
                <span className='sr-only'>Actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem disabled>
                <Pencil className='h-4 w-4' />
                Edit (Coming soon)
              </DropdownMenuItem>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className='text-destructive focus:text-destructive focus:bg-destructive/10'>
                  <Trash2 className='h-4 w-4 text-destructive' />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
            </DropdownMenuContent>
          </DropdownMenu>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete URL</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the shortened URL{' '}
                <span className='font-semibold font-mono'>{url.shortCode}</span>
                ? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant='destructive' onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
});
