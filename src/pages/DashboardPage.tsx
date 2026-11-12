import React, { useState } from 'react';
import {
  Home,
  Building,
  Mail,
  Phone,
  Globe,
  Shield,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { SUPPORTED_LANGUAGES } from '../types/auth';
import { TOKEN_STORAGE_KEY } from '../api/client';
import apiClient from '../api/client';

export const DashboardPage: React.FC = () => {
  const { user, isSecretary, isCommitteeOrAbove, refreshUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  if (!user) return null;

  const currentLang =
    SUPPORTED_LANGUAGES.find((l) => l.code === user.preferred_language)?.label ||
    user.preferred_language;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTestStatus(null);
    try {
      const refreshed = await refreshUser();
      if (refreshed) {
        setTestStatus('Profile data refreshed from GET /api/users/me.');
      }
    } catch {
      setTestStatus('Failed to refresh profile.');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Simulates a 401 response by corrupting the token and making an authenticated call
  const handleTest401AutoLogout = async () => {
    setTestStatus('Corrupting token to trigger 401 auto-logout...');
    localStorage.setItem(TOKEN_STORAGE_KEY, 'invalid-corrupted-token-test');
    try {
      await apiClient.get('/users/me');
    } catch {
      // The 401 response interceptor in client.ts will catch this, clear storage, and redirect!
    }
  };

  return (
    <div className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      {/* Welcome Banner */}
      <div className="bg-surface-2 border-[1.5px] border-border rounded-card p-6 sm:p-8 text-text shadow-soft mb-8 relative">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-accent/15 text-accent px-3 py-1 rounded-control text-xs font-semibold tracking-wide uppercase mb-3 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              <span>Society Profile &bull; Verified</span>
            </div>
            <h1 className="text-28 sm:text-40 font-heading font-bold text-text tracking-tight leading-tight">
              Welcome back, {user.name}
            </h1>
            <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2.5" aria-hidden="true" />
            <p className="mt-1.5 text-muted text-sm max-w-xl">
              You are signed in to GrievDesk as{' '}
              <span className="font-semibold capitalize text-text">
                {user.role === 'secretary' ? 'Society Secretary' : user.role}
              </span>
              . Your flat credentials and session are active.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={handleRefresh}
              isLoading={isRefreshing}
              leftIcon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh Profile
            </Button>
          </div>
        </div>
      </div>

      {testStatus && (
        <div className="mb-6">
          <Alert variant="info" onClose={() => setTestStatus(null)}>
            {testStatus}
          </Alert>
        </div>
      )}

      {/* Grid: Profile Details & Role Privileges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* User Card */}
        <div className="md:col-span-2 bg-surface rounded-card border-[1.5px] border-border shadow-soft p-6 sm:p-8">
          <div className="flex items-center justify-between border-b border-border pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-control bg-surface-2 border-[1.5px] border-border flex items-center justify-center text-text font-mono font-bold text-lg shadow-soft">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-lg font-bold text-text">{user.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge role={user.role} />
                  <Badge approvalStatus={user.approval_status} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3 p-3.5 rounded-control bg-surface-2 border-[1.5px] border-border">
              <Mail className="w-4 h-4 text-muted mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted font-medium">Gmail (Identifier)</p>
                <p className="font-semibold text-text break-all">{user.gmail}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-control bg-surface-2 border-[1.5px] border-border">
              <Phone className="w-4 h-4 text-muted mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted font-medium">Contact Number</p>
                <p className="font-semibold text-text">{user.phone || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-control bg-surface-2 border-[1.5px] border-border">
              <Home className="w-4 h-4 text-muted mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted font-medium">Flat Number</p>
                <p className="font-semibold text-text">{user.flat_no}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-control bg-surface-2 border-[1.5px] border-border">
              <Building className="w-4 h-4 text-muted mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted font-medium">Block / Tower</p>
                <p className="font-semibold text-text">{user.block_no}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-control bg-surface-2 border-[1.5px] border-border sm:col-span-2">
              <Globe className="w-4 h-4 text-muted mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-muted font-medium">Preferred Language (Translate on Read)</p>
                <p className="font-semibold text-text">
                  {currentLang} ({user.preferred_language})
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Roles & Permissions Card */}
        <div className="bg-surface rounded-card border-[1.5px] border-border shadow-soft p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-accent" />
              <h3 className="font-bold text-text text-sm">Role &amp; Permissions</h3>
            </div>

            <ul className="space-y-3 text-xs text-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-resolved-text shrink-0" />
                <span className="text-text">Raise complaints, service requests &amp; rules Q&amp;A</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-status-resolved-text shrink-0" />
                <span className="text-text">Access community Public Inbox &amp; Personal Dues</span>
              </li>

              {isCommitteeOrAbove ? (
                <>
                  <li className="flex items-center gap-2 font-medium text-text">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Manage ticket status &amp; assignments</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium text-text">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Publish announcements &amp; manage all dues</span>
                  </li>
                </>
              ) : (
                <li className="flex items-center gap-2 text-muted">
                  <span className="w-4 h-4 rounded-full border border-border flex items-center justify-center text-[10px]">
                    &times;
                  </span>
                  <span>Ticket triage &amp; dues management (Staff only)</span>
                </li>
              )}

              {isSecretary ? (
                <li className="flex items-center gap-2 font-bold text-accent">
                  <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                  <span>Approve resident registrations (Secretary only)</span>
                </li>
              ) : (
                <li className="flex items-center gap-2 text-muted">
                  <span className="w-4 h-4 rounded-full border border-border flex items-center justify-center text-[10px]">
                    &times;
                  </span>
                  <span>Approve resident signups (Secretary only)</span>
                </li>
              )}
            </ul>
          </div>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-[11px] text-muted mb-2">Test auto-logout mechanism:</p>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={handleTest401AutoLogout}
              className="text-xs text-status-escalated-text border-[1.5px] border-status-escalated-text/30 hover:bg-status-escalated-bg"
            >
              Simulate 401 Auto-Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Phase 1 Completion & Next Steps */}
      <div className="bg-surface-2 rounded-card p-6 border-[1.5px] border-border shadow-soft">
        <div className="flex items-center gap-2.5 mb-2 text-accent font-bold text-sm">
          <Layers className="w-4 h-4" />
          <span>Phase 1 Verification Status</span>
        </div>
        <p className="text-xs text-text-secondary leading-relaxed">
          The API client with JWT storage, automatic Bearer authentication header injection, 401
          unauthorized interception &amp; redirection, protected route guards, registration with
          strict secretary-uniqueness check, and login validation are fully wired to the backend API.
        </p>
      </div>
    </div>
  );
};

