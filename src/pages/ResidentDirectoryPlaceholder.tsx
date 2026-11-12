import React from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowLeft, Shield, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const ResidentDirectoryPlaceholder: React.FC = () => {
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
          <Users className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-heading font-bold text-text tracking-tight mb-2">
          Resident Directory
        </h1>
        <p className="text-sm text-muted max-w-lg mx-auto mb-6 leading-relaxed">
          Browse verified residents by Name, Flat No, and Block. Privacy-first: Phone numbers are
          hidden from fellow residents unless explicitly enabled via <code className="bg-surface-2 px-1.5 py-0.5 rounded-control text-accent border border-border">share_phone</code>.
          Committee &amp; Secretary accounts always see full contact details.
        </p>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-control bg-surface-2 border border-border text-text text-xs font-semibold mb-6">
          <Shield className="w-3.5 h-3.5 text-accent" />
          <span>Server-Side Filtered Directory</span>
        </div>

        <div>
          <Link to="/">
            <Button variant="outline" leftIcon={<Eye className="w-4 h-4" />}>
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

