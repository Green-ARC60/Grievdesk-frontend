import React from 'react';
import { Link } from 'react-router-dom';
import { Inbox, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const PublicInboxPlaceholder: React.FC = () => {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Noticeboard
          </Button>
        </Link>
      </div>

      <div className="bg-surface rounded-card border-[1.5px] border-border p-8 sm:p-12 text-center shadow-soft">
        <div className="w-16 h-16 rounded-card bg-surface-2 text-accent flex items-center justify-center mx-auto mb-5 border-[1.5px] border-border shadow-soft">
          <Inbox className="w-8 h-8" />
        </div>

        <h1 className="text-28 font-heading font-semibold text-text tracking-tight mb-2">
          Public Inbox (Community Feed)
        </h1>
        <p className="text-sm text-muted max-w-lg mx-auto mb-6 leading-relaxed">
          The Public Inbox displays the society-wide feed of all logged resident complaints.
          Supports anonymous post filtering where identity is hidden from fellow residents while
          remaining verifiable by the Committee &amp; Secretary.
        </p>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-control bg-surface-2 text-muted text-xs font-semibold mb-8 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-accent" />
          <span>Section Shell &bull; Live in Upcoming Phase</span>
        </div>

        <div className="pt-6 border-t border-border flex justify-center">
          <Link to="/">
            <Button variant="primary" leftIcon={<ShieldCheck className="w-4 h-4" />}>
              Go to Noticeboard to Log a Complaint
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
