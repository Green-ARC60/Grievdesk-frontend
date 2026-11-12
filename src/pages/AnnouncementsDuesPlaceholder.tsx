import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ArrowLeft, Pin, Megaphone, Shield } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AnnouncementsDuesPlaceholder: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'announcements' | 'dues'>('announcements');

  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to AI Desk
          </Button>
        </Link>
      </div>

      <div className="bg-surface rounded-3xl border border-border overflow-hidden shadow-xs">
        {/* Sub-tabs header */}
        <div className="flex border-b border-border bg-surface-elevated px-6 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'announcements'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Announcements &amp; Circulars</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dues')}
            className={`flex items-center gap-2 pb-3 px-4 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'dues'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Society Dues &amp; Receipts</span>
          </button>
        </div>

        <div className="p-8 sm:p-12 text-center">
          {activeTab === 'announcements' ? (
            <div>
              <div className="w-14 h-14 rounded-card bg-surface-2 text-accent flex items-center justify-center mx-auto mb-4 border border-border shadow-soft">
                <Pin className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-text-primary mb-2">Announcements Hub</h2>
              <p className="text-sm text-text-muted max-w-md mx-auto mb-6 leading-relaxed">
                Contains Pinned Circulars (important rules, water shutdowns, AGM meetings) and
                General Circulars. Residents read notices in their preferred language via translate-on-read.
              </p>
            </div>
          ) : (
            <div>
              <div className="w-14 h-14 rounded-card bg-accent/10 text-accent flex items-center justify-center mx-auto mb-4 border-[1.5px] border-accent/20">
                <CreditCard className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-bold text-text mb-2">Personal Dues Management</h2>
              <p className="text-sm text-muted max-w-md mx-auto mb-6 leading-relaxed">
                Strictly personal: Residents see only their own monthly maintenance status and payment history.
                Committee and Secretary manage all society flats from here.
              </p>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-control bg-surface-2 border border-border text-text text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-accent" />
            <span>Dedicated Screen &bull; Phase 6 Integration</span>
          </div>
        </div>
      </div>
    </div>
  );
};
