import React, { useState } from 'react';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Banner } from './Banner';

export interface ExternalLinkModalProps {
  url: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ExternalLinkModal: React.FC<ExternalLinkModalProps> = ({ url, isOpen, onClose }) => {
  let hostname = '';
  try {
    if (url) {
      hostname = new URL(url).hostname;
    }
  } catch {
    hostname = url || '';
  }

  const handleContinue = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="You are leaving Pratikar"
      description="External websites have their own privacy policies and may record your IP address or visit."
      maxWidth="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel & Stay
          </Button>
          <Button variant="primary" onClick={handleContinue}>
            Proceed to External Site →
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <span className="block text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Destination Domain:
          </span>
          <p className="font-mono text-sm font-bold text-foreground break-all pt-1">
            {hostname}
          </p>
        </div>

        <Banner variant="warning" title="Privacy Advisory">
          Pratikar does not share any case data with external services. However, visiting external websites outside a private window may leave entries in your browser history.
        </Banner>
      </div>
    </Dialog>
  );
};

export interface SafeExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Accessible external link that prevents automatic navigation and triggers
 * the statutory privacy exit interstitial modal.
 */
export const SafeExternalLink: React.FC<SafeExternalLinkProps> = ({
  href,
  children,
  className = '',
  ...props
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsModalOpen(true);
  };

  return (
    <>
      <a
        href={href}
        onClick={handleClick}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        {...props}
      >
        {children}
      </a>

      <ExternalLinkModal
        url={href}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
