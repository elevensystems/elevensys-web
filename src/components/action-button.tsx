import * as React from 'react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type ButtonProps = React.ComponentProps<typeof Button>;

type ActionButtonProps = Omit<ButtonProps, 'asChild'> & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
};

function ActionButton({
  leftIcon,
  rightIcon,
  isLoading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ActionButtonProps) {
  const displayedLeft = isLoading ? <Spinner /> : leftIcon;

  if (process.env.NODE_ENV === 'development') {
    if (!children && !props['aria-label']) {
      console.warn(
        'ActionButton: Icon-only buttons require an `aria-label` for accessibility.'
      );
    }
  }

  return (
    <Button disabled={isLoading || disabled} {...props}>
      {displayedLeft}
      {isLoading && loadingText ? loadingText : children}
      {rightIcon}
    </Button>
  );
}

export { ActionButton, type ActionButtonProps };
