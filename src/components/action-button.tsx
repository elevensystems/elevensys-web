import * as React from 'react';

import { Check, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type ButtonProps = React.ComponentProps<typeof Button>;

type ActionButtonProps = Omit<ButtonProps, 'asChild'> & {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  feedbackActive?: boolean;
  feedbackError?: boolean;
};

function ActionButton({
  leftIcon,
  rightIcon,
  isLoading = false,
  loadingText,
  feedbackActive = false,
  feedbackError = false,
  children,
  disabled,
  ...props
}: ActionButtonProps) {
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [announcement, setAnnouncement] = React.useState('');
  const [feedbackKey, setFeedbackKey] = React.useState(0);
  const [restoreKey, setRestoreKey] = React.useState(0);
  const [exiting, setExiting] = React.useState(false);
  const prevFeedbackActive = React.useRef(false);

  React.useEffect(() => {
    if (feedbackActive && !prevFeedbackActive.current) {
      setFeedbackKey((k) => k + 1);
      const text = buttonRef.current?.textContent?.trim() || '';
      const suffix = feedbackError ? 'failed' : 'successful';
      setAnnouncement(text ? `${text} ${suffix}` : suffix);
    } else if (!feedbackActive && prevFeedbackActive.current) {
      setExiting(true);
      const timer = setTimeout(() => {
        setExiting(false);
        setRestoreKey((k) => k + 1);
        setAnnouncement('');
      }, 200);
      return () => clearTimeout(timer);
    }
    prevFeedbackActive.current = feedbackActive;
  }, [feedbackActive, feedbackError]);

  const IconSlot = React.useCallback(
    ({ children: slotChildren }: { children: React.ReactNode }) => (
      <span className='inline-flex items-center justify-center [&>svg]:shrink-0'>
        {slotChildren}
      </span>
    ),
    []
  );

  const feedbackIcon = feedbackError ? (
    <X
      key={feedbackKey}
      className={exiting ? 'animate-bounce-out' : 'animate-bounce-in'}
    />
  ) : (
    <Check
      key={feedbackKey}
      className={exiting ? 'animate-bounce-out' : 'animate-bounce-in'}
    />
  );

  const hasIconSlot = !!(leftIcon || feedbackActive || exiting || isLoading);

  const resolvedLeft = hasIconSlot ? (
    <IconSlot>
      {isLoading ? (
        <Spinner />
      ) : feedbackActive || exiting ? (
        feedbackIcon
      ) : (
        <span
          key={restoreKey}
          className={restoreKey > 0 ? 'animate-bounce-in' : undefined}
        >
          {leftIcon}
        </span>
      )}
    </IconSlot>
  ) : null;

  if (process.env.NODE_ENV === 'development') {
    if (!children && !props['aria-label']) {
      console.warn(
        'ActionButton: Icon-only buttons require an `aria-label` for accessibility.'
      );
    }
  }

  return (
    <Button ref={buttonRef} disabled={isLoading || disabled} {...props}>
      {resolvedLeft}
      {isLoading && loadingText ? loadingText : children}
      {rightIcon}
      {announcement && (
        <span className='sr-only' aria-live='polite'>
          {announcement}
        </span>
      )}
    </Button>
  );
}

export { ActionButton, type ActionButtonProps };
