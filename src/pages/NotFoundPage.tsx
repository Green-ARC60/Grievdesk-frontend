import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 text-center">
      <div className="max-w-md w-full bg-surface p-8 sm:p-10 border-[1.5px] border-border rounded-card shadow-soft">
        <div className="w-16 h-16 rounded-card mx-auto flex items-center justify-center bg-surface-2 text-muted border-[1.5px] border-border mb-6">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-heading font-bold text-text mb-2">Page Not Found (404)</h1>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          The requested page does not exist in the GrievDesk society portal.
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

