import React from 'react';
import {
  AlertCircle,
  Wrench,
  BookOpen,
  ShieldAlert,
  Megaphone,
  CreditCard,
  Pin,
  EyeOff,
} from 'lucide-react';
import { SelectedType, CommitteeAction } from '../../types/chat';

interface TypeChipsProps {
  selectedType: SelectedType | null;
  onSelectType: (type: SelectedType) => void;
  isStaff: boolean; // Committee or Secretary

  // Complaint options
  isAnonymous: boolean;
  onToggleAnonymous: (val: boolean) => void;

  // Committee Action options
  committeeAction: CommitteeAction;
  onSelectCommitteeAction: (action: CommitteeAction) => void;
  isPinned: boolean;
  onTogglePin: (val: boolean) => void;
  targetFlat: string;
  onChangeTargetFlat: (val: string) => void;
  targetBlock: string;
  onChangeTargetBlock: (val: string) => void;
}

export const TypeChips: React.FC<TypeChipsProps> = React.memo(({
  selectedType,
  onSelectType,
  isStaff,
  isAnonymous,
  onToggleAnonymous,
  committeeAction,
  onSelectCommitteeAction,
  isPinned,
  onTogglePin,
  targetFlat,
  onChangeTargetFlat,
  targetBlock,
  onChangeTargetBlock,
}) => {
  const chips: {
    type: SelectedType;
    label: string;
    icon: React.ReactNode;
    description: string;
  }[] = [
    {
      type: 'complaint',
      label: 'Complaint',
      icon: <AlertCircle className="w-4 h-4" />,
      description: 'Report issues like plumbing, electrical, noise, water supply',
    },
    {
      type: 'service',
      label: 'Service Request',
      icon: <Wrench className="w-4 h-4" />,
      description: 'Request plumber, electrician, AC mechanic, laundry, car wash',
    },
    {
      type: 'rules',
      label: 'Rules Q&A',
      icon: <BookOpen className="w-4 h-4" />,
      description: 'Ask questions directly answered from society bylaws & circulars',
    },
  ];

  if (isStaff) {
    chips.push({
      type: 'committee_action',
      label: 'Committee Action',
      icon: <ShieldAlert className="w-4 h-4" />,
      description: 'Staff only: draft notices or send targeted dues reminders',
    });
  }

  return (
    <div className="space-y-2.5">
      {/* Type Selector Header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted uppercase tracking-wider font-mono">
          Message Category <span className="text-status-escalated-text">*</span>
        </span>
        {selectedType && (
          <span className="text-[11px] text-muted font-medium">
            Strictly routed to this category
          </span>
        )}
      </div>

      {/* Main Intent Chips: large (44px or taller), 1.5px bordered, icon plus label; selected is solid cobalt */}
      <div className="flex flex-wrap gap-2.5">
        {chips.map((chip) => {
          const isSelected = selectedType === chip.type;
          return (
            <button
              key={chip.type}
              type="button"
              onClick={() => onSelectType(chip.type)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-control text-xs sm:text-sm font-semibold transition-colors duration-180 ease-calm select-none border-[1.5px] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                isSelected
                  ? 'bg-accent text-accent-text border-accent shadow-soft hover:bg-accent-hover active:bg-accent-active font-bold'
                  : 'bg-surface text-text border-border hover:bg-surface-2 hover:border-accent/40 focus-visible:text-accent active:bg-surface-2/80'
              }`}
            >
              <span className={`w-4 h-4 shrink-0 transition-colors duration-180 ease-calm ${isSelected ? 'text-accent-text' : 'text-accent'}`}>
                {chip.icon}
              </span>
              <span className={isSelected ? 'text-current' : ''}>{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-options for Complaint */}
      {selectedType === 'complaint' && (
        <div className="flex items-center gap-2 pt-1 pl-1 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer text-muted hover:text-text font-medium select-none">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => onToggleAnonymous(e.target.checked)}
              className="rounded-control border-border text-accent focus:ring-accent w-4 h-4"
            />
            <EyeOff className="w-3.5 h-3.5 text-muted" />
            <span>Post anonymously to Public Inbox (hide flat and name from other residents)</span>
          </label>
        </div>
      )}

      {/* Sub-options for Committee Action (Staff Only) */}
      {selectedType === 'committee_action' && isStaff && (
        <div className="p-3.5 rounded-card bg-surface-2 border-[1.5px] border-border space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-text">Committee Action Sub-Type:</span>
            <div className="inline-flex rounded-control border border-border bg-surface p-0.5">
              <button
                type="button"
                onClick={() => onSelectCommitteeAction('announcement')}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium flex items-center gap-1.5 transition-colors duration-180 ease-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  committeeAction === 'announcement'
                    ? 'bg-accent text-accent-text font-semibold shadow-soft hover:bg-accent-hover active:bg-accent-active'
                    : 'text-muted hover:text-accent hover:bg-surface-2 focus-visible:text-accent'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5 text-current" />
                <span className={committeeAction === 'announcement' ? 'text-current' : ''}>Notice / Announcement</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectCommitteeAction('dues_reminder')}
                className={`px-3 py-1.5 rounded-[6px] text-xs font-medium flex items-center gap-1.5 transition-colors duration-180 ease-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  committeeAction === 'dues_reminder'
                    ? 'bg-accent text-accent-text font-semibold shadow-soft hover:bg-accent-hover active:bg-accent-active'
                    : 'text-muted hover:text-accent hover:bg-surface-2 focus-visible:text-accent'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-current" />
                <span className={committeeAction === 'dues_reminder' ? 'text-current' : ''}>Targeted Dues Reminder</span>
              </button>
            </div>
          </div>

          {/* If Announcement: Pin Option */}
          {committeeAction === 'announcement' && (
            <div className="flex items-center gap-2 pt-1">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-text select-none">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => onTogglePin(e.target.checked)}
                  className="rounded-control border-border text-accent focus:ring-accent w-4 h-4"
                />
                <Pin className="w-3.5 h-3.5 text-accent" />
                <span>Pin notice to the top of Announcements</span>
              </label>
            </div>
          )}

          {/* If Dues Reminder: Flat and Block Inputs */}
          {committeeAction === 'dues_reminder' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-text mb-1">
                  Target Flat No <span className="text-status-escalated-text">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 402"
                  value={targetFlat}
                  onChange={(e) => onChangeTargetFlat(e.target.value)}
                  className="app-input w-full text-xs py-1.5 px-3 rounded-control"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-text mb-1">
                  Target Block / Tower <span className="text-status-escalated-text">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Block A"
                  value={targetBlock}
                  onChange={(e) => onChangeTargetBlock(e.target.value)}
                  className="app-input w-full text-xs py-1.5 px-3 rounded-control"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

TypeChips.displayName = 'TypeChips';
