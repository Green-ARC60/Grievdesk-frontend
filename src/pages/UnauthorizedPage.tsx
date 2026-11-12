import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-md w-full bg-surface p-8 sm:p-10 border-[1.5px] border-border rounded-card shadow-soft">
        <div className="w-16 h-16 rounded-card mx-auto flex items-center justify-center bg-status-escalated-bg text-status-escalated-text border-[1.5px] border-status-escalated-text/25 mb-6">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-text mb-2">Access Denied (403)</h1>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          You do not have the required role privileges to access this section of GrievDesk. This
          action is restricted to Committee or Secretary accounts.
        </p>
        <Link to="/">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

