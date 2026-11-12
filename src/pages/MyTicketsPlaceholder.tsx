import React from 'react';
import { Link } from 'react-router-dom';
import { Ticket, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const MyTicketsPlaceholder: React.FC = () => {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to AI Desk
          </Button>
        </Link>
      </div>

      <div className="bg-surface rounded-card border-[1.5px] border-border p-8 sm:p-12 text-center shadow-soft">
        <div className="w-16 h-16 rounded-card bg-accent/10 text-accent flex items-center justify-center mx-auto mb-5 border-[1.5px] border-accent/20">
          <Ticket className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-heading font-bold text-text tracking-tight mb-2">
          My Tickets &amp; Service Requests
        </h1>
        <p className="text-sm text-muted max-w-lg mx-auto mb-6 leading-relaxed">
          Displays the logged-in resident's personal complaint and service request history with an
          audit status timeline (New &rarr; In Progress &rarr; Resolved / Escalated).
        </p>

        <div className="max-w-md mx-auto p-4 rounded-control bg-surface-2 border-[1.5px] border-border mb-6 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-text mb-2">
            <Clock className="w-4 h-4 text-accent" />
            <span>Auto-Escalation Architecture</span>
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Any complaints sitting in 'new' status past the society escalation threshold (e.g., 5 days)
            auto-flip to 'escalated' and alert the Secretary for immediate triage.
          </p>
        </div>

        <Link to="/">
          <Button variant="primary" leftIcon={<CheckCircle2 className="w-4 h-4" />}>
            Submit a New Request
          </Button>
        </Link>
      </div>
    </div>
  );
};

