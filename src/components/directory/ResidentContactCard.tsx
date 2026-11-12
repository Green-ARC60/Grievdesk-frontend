import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  PhoneOff,
  Mail,
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
  Crown,
} from 'lucide-react';
import { DirectoryUser } from '../../types/users';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface ResidentContactCardProps {
  user: DirectoryUser;
  isSelf: boolean;
  canManage: boolean;
  isSecretaryViewer: boolean;
  actionBusyId: number | null;
  onCopy: (text: string, label: string) => void;
  onPromote?: (target: DirectoryUser) => void;
  onDemote?: (target: DirectoryUser) => void;
  onTransfer?: (target: DirectoryUser) => void;
}

export const ResidentContactCard: React.FC<ResidentContactCardProps> = React.memo(({
  user,
  isSelf,
  canManage,
  isSecretaryViewer,
  actionBusyId,
  onCopy,
  onPromote,
  onDemote,
  onTransfer,
}) => {
  // Initials avatar (flat token color, no gradient)
  const initials = (user.name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const isSecretary = user.role === 'secretary';
  const isCommittee = user.role === 'committee';
  const isBusy = actionBusyId === user.id;

  return (
    <div className="bg-surface rounded-card border-[1.5px] border-border p-4 shadow-soft flex flex-col justify-between h-full transition-colors duration-180 ease-calm hover:border-accent/40 hover:bg-surface-2/30">
      <div className="space-y-3">
        {/* Header: Avatar, Name, Badges, Flat/Block */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-control bg-surface-2 border border-border flex items-center justify-center font-mono font-bold text-xs text-text shrink-0 select-none"
            aria-hidden="true"
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <h3
                className="font-heading font-semibold text-text text-sm sm:text-base leading-snug truncate"
                title={user.name}
              >
                {user.name}
              </h3>

              {isSelf && (
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-control bg-accent/15 text-accent border border-accent/25 select-none">
                  You
                </span>
              )}

              {isSecretary && <Badge role="secretary" size="sm" />}
              {isCommittee && <Badge role="committee" size="sm" />}
            </div>

            <p className="text-xs text-muted font-mono mt-0.5">
              Flat {user.flat_no || '—'} &bull; Block {user.block_no || '—'}
            </p>
          </div>
        </div>

        {/* Contact rows */}
        <div className="space-y-1 text-xs pt-1 border-t border-border/60">
          {/* Primary Phone */}
          {user.phone ? (
            <div className="flex items-center justify-between gap-2 min-h-[44px]">
              <a
                href={`tel:${user.phone}`}
                className="inline-flex items-center gap-2 text-text font-mono hover:text-accent transition-colors duration-180 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-control p-1"
              >
                <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>{user.phone}</span>
              </a>

              <button
                type="button"
                onClick={() => onCopy(user.phone!, `${user.name}'s phone number`)}
                className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center text-muted hover:text-accent rounded-control transition-colors duration-180 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                title="Copy phone number"
                aria-label={`Copy ${user.name}'s phone number`}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between min-h-[44px] text-xs">
              <span className="inline-flex items-center gap-2 text-muted italic p-1">
                <PhoneOff className="w-3.5 h-3.5 text-muted shrink-0" />
                <span>Number not shared</span>
              </span>

              {isSelf && (
                <Link
                  to="/profile"
                  className="text-xs font-medium text-accent hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-control px-2 py-1 min-h-[44px] flex items-center"
                >
                  Change in Profile
                </Link>
              )}
            </div>
          )}

          {/* Forward-compatible: Multiple numbers (alt_phones) */}
          {Array.isArray(user.alt_phones) &&
            user.alt_phones.length > 0 &&
            user.alt_phones.map((altPhone, idx) => (
              <div key={idx} className="flex items-center justify-between gap-2 min-h-[44px]">
                <a
                  href={`tel:${altPhone}`}
                  className="inline-flex items-center gap-2 text-text font-mono hover:text-accent transition-colors duration-180 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-control p-1"
                >
                  <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span>{altPhone}</span>
                </a>

                <button
                  type="button"
                  onClick={() => onCopy(altPhone, 'alternate phone number')}
                  className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center text-muted hover:text-accent rounded-control transition-colors duration-180 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  title="Copy alternate phone"
                  aria-label={`Copy alternate phone ${altPhone}`}
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

          {/* Email row (only present in staff view or own row) */}
          {user.gmail && (
            <div className="flex items-center justify-between gap-2 min-h-[44px]">
              <a
                href={`mailto:${user.gmail}`}
                className="inline-flex items-center gap-2 text-muted font-mono hover:text-accent transition-colors duration-180 truncate focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-control p-1"
                title={user.gmail}
              >
                <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                <span className="truncate">{user.gmail}</span>
              </a>

              <button
                type="button"
                onClick={() => onCopy(user.gmail!, `${user.name}'s email address`)}
                className="min-h-[44px] min-w-[44px] p-2 flex items-center justify-center text-muted hover:text-accent rounded-control transition-colors duration-180 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent shrink-0"
                title="Copy email address"
                aria-label={`Copy ${user.name}'s email address`}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Staff Actions (Promote / Demote / Transfer) */}
      {canManage && !isSelf && (
        <div className="pt-2 mt-2 border-t border-border flex items-center justify-end gap-1.5 flex-wrap">
          {user.role === 'resident' && onPromote && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onPromote(user)}
              disabled={isBusy}
              leftIcon={<ArrowUpRight className="w-3 h-3" />}
              className="text-xs min-h-[36px] py-1 px-2.5"
            >
              Promote
            </Button>
          )}

          {isSecretaryViewer && isCommittee && onDemote && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDemote(user)}
              disabled={isBusy}
              leftIcon={<ArrowDownLeft className="w-3 h-3 text-status-inprogress-text" />}
              className="text-xs min-h-[36px] py-1 px-2.5 text-status-inprogress-text"
            >
              Demote
            </Button>
          )}

          {isSecretaryViewer && !isSecretary && onTransfer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onTransfer(user)}
              disabled={isBusy}
              leftIcon={<Crown className="w-3 h-3 text-accent" />}
              className="text-xs min-h-[36px] py-1 px-2.5 text-accent"
            >
              Transfer
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

ResidentContactCard.displayName = 'ResidentContactCard';

