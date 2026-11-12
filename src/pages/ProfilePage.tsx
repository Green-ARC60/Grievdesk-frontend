import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Languages,
  Shield,
  Crown,
  Lock,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Check,
  Loader2,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_LANGUAGES } from '../types/auth';
import { DirectoryUser } from '../types/users';
import {
  updateUserProfileApi,
  getDirectoryUsersApi,
  approveUserApi,
  transferSecretaryApi,
} from '../api/users';
import { uploadRulebookFileApi, uploadRulebookTextApi } from '../api/rules';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { mapBackendError } from '../api/errorMapper';

export const ProfilePage: React.FC = () => {
  const { user, isSecretary, isCommitteeOrAbove, updateUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'approvals' | 'staff'>(
    'profile'
  );

  // ----------------------------------------------------
  // Profile Edit State
  // ----------------------------------------------------
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [preferredLanguage, setPreferredLanguage] = useState(
    user?.preferred_language || 'en'
  );
  const [sharePhone, setSharePhone] = useState<boolean>(user?.share_phone ?? false);
  const [flatNo, setFlatNo] = useState(user?.flat_no || '');
  const [blockNo, setBlockNo] = useState(user?.block_no || '');

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Re-approval modal for flat/block change
  const [showReapprovalModal, setShowReapprovalModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<any>(null);

  // Sync state if user context updates
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setPreferredLanguage(user.preferred_language);
      setSharePhone(user.share_phone ?? false);
      setFlatNo(user.flat_no);
      setBlockNo(user.block_no);
    }
  }, [user]);

  // ----------------------------------------------------
  // Password Change State
  // ----------------------------------------------------
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // ----------------------------------------------------
  // Secretary Approvals Queue State
  // ----------------------------------------------------
  const [pendingUsers, setPendingUsers] = useState<DirectoryUser[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [approvalsError, setApprovalsError] = useState<string | null>(null);
  const [approvalsSuccess, setApprovalsSuccess] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    if (!isSecretary) return;
    setIsLoadingPending(true);
    setApprovalsError(null);
    try {
      const data = await getDirectoryUsersApi('pending');
      setPendingUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setApprovalsError(mapBackendError(err));
    } finally {
      setIsLoadingPending(false);
    }
  }, [isSecretary]);

  useEffect(() => {
    if (isSecretary && activeTab === 'approvals') {
      fetchPendingUsers();
    }
  }, [isSecretary, activeTab, fetchPendingUsers]);

  const handleApproveUser = async (targetId: number, targetName: string) => {
    setApprovingId(targetId);
    setApprovalsError(null);
    setApprovalsSuccess(null);
    try {
      const res = await approveUserApi(targetId);
      setApprovalsSuccess(res.message || `${targetName} has been approved.`);
      setPendingUsers((prev) => prev.filter((u) => u.id !== targetId));
    } catch (err) {
      setApprovalsError(mapBackendError(err));
    } finally {
      setApprovingId(null);
    }
  };

  // ----------------------------------------------------
  // Staff Rulebook Upload State
  // ----------------------------------------------------
  const [rulebookText, setRulebookText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingRulebook, setIsUploadingRulebook] = useState(false);
  const [rulebookSuccess, setRulebookSuccess] = useState<string | null>(null);
  const [rulebookError, setRulebookError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------
  // Transfer Secretary State
  // ----------------------------------------------------
  const [eligibleTransferees, setEligibleTransferees] = useState<DirectoryUser[]>([]);
  const [selectedTransfereeId, setSelectedTransfereeId] = useState<string>('');
  const [isTransferringSecretary, setIsTransferringSecretary] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);
  const [transferError, setTransferError] = useState<string | null>(null);

  const fetchTransferees = useCallback(async () => {
    if (!isSecretary) return;
    try {
      const data = await getDirectoryUsersApi('approved');
      setEligibleTransferees(data.filter((u) => u.id !== user?.id));
    } catch {
      // quiet catch
    }
  }, [isSecretary, user?.id]);

  useEffect(() => {
    if (isSecretary && activeTab === 'staff') {
      fetchTransferees();
    }
  }, [isSecretary, activeTab, fetchTransferees]);

  // ----------------------------------------------------
  // Save Profile Handler
  // ----------------------------------------------------
  const handleSaveProfile = async (confirmReapproval = false) => {
    setProfileError(null);
    setProfileSuccess(null);
    setIsSavingProfile(true);

    const payload: any = {
      name: name.trim(),
      phone: phone.trim(),
      preferred_language: preferredLanguage,
      share_phone: sharePhone,
      flat_no: flatNo.trim(),
      block_no: blockNo.trim(),
    };

    if (confirmReapproval) {
      payload.confirm_reapproval = true;
    }

    try {
      const res = await updateUserProfileApi(payload);
      updateUser(res.user);
      setProfileSuccess(res.message || 'Profile updated successfully.');
      setShowReapprovalModal(false);
      setPendingChanges(null);

      // If resident moved flat and was reset to pending, log out
      if (res.user.approval_status === 'pending') {
        setTimeout(() => {
          logout();
        }, 2000);
      }
    } catch (err: any) {
      if (
        err?.response?.data?.error === 'reapproval_required' &&
        !confirmReapproval
      ) {
        setPendingChanges(payload);
        setShowReapprovalModal(true);
      } else {
        setProfileError(mapBackendError(err));
      }
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ----------------------------------------------------
  // Change Password Handler
  // ----------------------------------------------------
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await updateUserProfileApi({
        current_password: currentPassword,
        new_password: newPassword,
      });
      updateUser(res.user);
      setPasswordSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(mapBackendError(err));
    } finally {
      setIsChangingPassword(false);
    }
  };

  // ----------------------------------------------------
  // Handle Rulebook Upload
  // ----------------------------------------------------
  const handleRulebookUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setRulebookError(null);
    setRulebookSuccess(null);

    if (!selectedFile && !rulebookText.trim()) {
      setRulebookError('Please select a file (.pdf, .txt) or paste rulebook text.');
      return;
    }

    setIsUploadingRulebook(true);
    try {
      let res;
      if (selectedFile) {
        res = await uploadRulebookFileApi(selectedFile);
      } else {
        res = await uploadRulebookTextApi(rulebookText.trim());
      }
      setRulebookSuccess(
        `Rulebook version ${res.version} successfully uploaded (${res.characters.toLocaleString()} characters indexed for AI Q&A).`
      );
      setSelectedFile(null);
      setRulebookText('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setRulebookError(mapBackendError(err));
    } finally {
      setIsUploadingRulebook(false);
    }
  };

  // ----------------------------------------------------
  // Handle Transfer Secretary
  // ----------------------------------------------------
  const handleTransferSecretarySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);
    setTransferSuccess(null);

    if (!selectedTransfereeId) {
      setTransferError('Please select an approved member to transfer the role to.');
      return;
    }

    const targetUser = eligibleTransferees.find(
      (u) => u.id === parseInt(selectedTransfereeId, 10)
    );
    if (
      !window.confirm(
        `Are you absolutely sure you want to transfer the Secretary role to ${
          targetUser?.name || 'this user'
        }? You will become a Committee member.`
      )
    ) {
      return;
    }

    setIsTransferringSecretary(true);
    try {
      const res = await transferSecretaryApi(parseInt(selectedTransfereeId, 10));
      setTransferSuccess(
        res.message || `Secretary role transferred to ${targetUser?.name}.`
      );
      if (res.you) {
        updateUser({
          ...user!,
          role: res.you.role,
        });
      }
    } catch (err) {
      setTransferError(mapBackendError(err));
    } finally {
      setIsTransferringSecretary(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-24 sm:text-30 font-heading font-bold text-text tracking-tight">
            Account &amp; Settings
          </h1>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2.5" aria-hidden="true" />
          <p className="text-xs sm:text-sm text-muted mt-1">
            Manage your personal profile, privacy preferences, security, and society tools.
          </p>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2">
          {isSecretary ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-medium bg-status-escalated-bg text-status-escalated-text font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-status-escalated-text" />
              Society Secretary
            </span>
          ) : isCommitteeOrAbove ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-medium bg-status-new-bg text-status-new-text font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-status-new-text" />
              Committee Member
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-medium bg-surface-2 text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-muted" />
              Resident
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-3.5 py-2 text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-text font-medium'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Profile Details</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-text font-medium'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Password &amp; Security</span>
        </button>

        {/* Secretary Only: Pending Approvals */}
        {isSecretary && (
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`px-3.5 py-2 text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'approvals'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-muted hover:text-text font-medium'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Approvals</span>
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-control text-[10px] font-mono bg-status-inprogress-bg text-status-inprogress-text font-bold">
                {pendingUsers.length}
              </span>
            )}
          </button>
        )}

        {/* Staff Tools: Committee & Secretary */}
        {isCommitteeOrAbove && (
          <button
            type="button"
            onClick={() => setActiveTab('staff')}
            className={`px-3.5 py-2 text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'staff'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-muted hover:text-text font-medium'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Staff Bylaws &amp; Tools</span>
          </button>
        )}
      </div>

      {/* -------------------------------------------------- */}
      {/* TAB 1: PROFILE DETAILS */}
      {/* -------------------------------------------------- */}
      {activeTab === 'profile' && (
        <div className="bg-surface rounded-card border border-border p-6 sm:p-8 space-y-6 shadow-xs">
          {profileError && (
            <Alert variant="error" className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{profileError}</span>
            </Alert>
          )}

          {profileSuccess && (
            <Alert variant="success" className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{profileSuccess}</span>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Full Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="h-11"
              />
            </div>

            {/* Email Address (Non-editable) */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Gmail (Sign-in Account)
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  value={user?.gmail || ''}
                  disabled
                  className="pl-10 h-11 bg-surface-elevated text-text-muted border-border cursor-not-allowed"
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                Gmail address cannot be changed once registered.
              </p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Preferred Language */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Preferred Language (AI Translations)
              </label>
              <div className="relative">
                <Languages className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <select
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="app-input w-full pl-10 pr-4 h-11 rounded-xl text-sm font-medium"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label} ({lang.nativeLabel})
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-text-muted mt-1">
                All assistant replies, announcements, and circulars will be localized to this language.
              </p>
            </div>

            {/* Flat Number */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Flat / Apartment Number
              </label>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <Input
                  value={flatNo}
                  onChange={(e) => setFlatNo(e.target.value)}
                  placeholder="e.g. 402"
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Block Number */}
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Block / Tower
              </label>
              <Input
                value={blockNo}
                onChange={(e) => setBlockNo(e.target.value)}
                placeholder="e.g. A"
                className="h-11"
              />
            </div>
          </div>

          {/* Privacy Toggle: Share Phone */}
          <div className="pt-4 border-t border-border flex items-start gap-3 bg-surface-2 p-4 rounded-control border-[1.5px] border-border">
            <input
              type="checkbox"
              id="share_phone_toggle"
              checked={sharePhone}
              onChange={(e) => setSharePhone(e.target.checked)}
              className="mt-1 w-4 h-4 text-accent rounded border-border focus:ring-accent"
            />
            <label htmlFor="share_phone_toggle" className="text-xs sm:text-sm text-text-secondary cursor-pointer">
              <span className="font-bold text-text-primary block">
                Share phone number in Resident Directory
              </span>
              When checked, other verified society residents can view your contact number in the
              Resident Directory. When unchecked, your phone number remains private and only visible
              to the Society Committee and Secretary.
            </label>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button
              variant="primary"
              size="md"
              onClick={() => handleSaveProfile(false)}
              disabled={isSavingProfile}
              className="flex items-center gap-2"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Profile</span>
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* TAB 2: PASSWORD & SECURITY */}
      {/* -------------------------------------------------- */}
      {activeTab === 'security' && (
        <div className="bg-surface rounded-card border border-border p-6 sm:p-8 space-y-6 shadow-xs max-w-2xl">
          <div>
            <h2 className="text-base font-extrabold text-text-primary">Change Password</h2>
            <p className="text-xs text-text-muted mt-1">
              Keep your account secure with a strong password of at least 8 characters.
            </p>
          </div>

          {passwordError && (
            <Alert variant="error" className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{passwordError}</span>
            </Alert>
          )}

          {passwordSuccess && (
            <Alert variant="success" className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{passwordSuccess}</span>
            </Alert>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="pr-10 h-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                New Password (min 8 characters)
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="h-11"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <Input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
                className="h-11"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isChangingPassword}
                className="flex items-center gap-2"
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Update Password</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* TAB 3: SECRETARY PENDING APPROVALS */}
      {/* -------------------------------------------------- */}
      {activeTab === 'approvals' && isSecretary && (
        <div className="bg-surface rounded-card border border-border p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <Clock className="w-5 h-5 text-status-inprogress-text" />
                <span>Pending Resident Registrations ({pendingUsers.length})</span>
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Only the Society Secretary can approve new resident accounts and flat transfers.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchPendingUsers}
              disabled={isLoadingPending}
              className="text-xs self-start sm:self-auto"
            >
              Refresh Queue
            </Button>
          </div>

          {approvalsError && (
            <Alert variant="error" className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{approvalsError}</span>
            </Alert>
          )}

          {approvalsSuccess && (
            <Alert variant="success" className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{approvalsSuccess}</span>
            </Alert>
          )}

          {isLoadingPending ? (
            <TableSkeleton rows={3} />
          ) : pendingUsers.length === 0 ? (
            <div className="border border-border rounded-card bg-surface">
              <EmptyState message="No pending resident signups waiting for approval." />
            </div>
          ) : (
            <div className="border border-border rounded-card bg-surface divide-y divide-border overflow-hidden">
              {pendingUsers.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 sm:p-4 hover:bg-surface-2/60 transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text text-sm">{p.name}</span>
                      <StatusBadge status="Pending" variant="in_progress" size="sm" />
                    </div>
                    <div className="text-xs text-muted flex flex-wrap gap-x-4 gap-y-1">
                      <span>
                        <strong className="text-text font-medium">Flat:</strong>{' '}
                        <span className="font-mono">{p.flat_no}, {p.block_no}</span>
                      </span>
                      {p.gmail && (
                        <span>
                          <strong className="text-text font-medium">Email:</strong> {p.gmail}
                        </span>
                      )}
                      {p.phone && (
                        <span>
                          <strong className="text-text font-medium">Phone:</strong> {p.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApproveUser(p.id, p.name)}
                    disabled={approvingId === p.id}
                    className="whitespace-nowrap self-end sm:self-auto"
                  >
                    {approvingId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Check className="w-4 h-4" /> Approve Resident
                      </span>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* TAB 4: STAFF TOOLS (RULEBOOK UPLOAD & SECRETARY TRANSFER) */}
      {/* -------------------------------------------------- */}
      {activeTab === 'staff' && isCommitteeOrAbove && (
        <div className="space-y-6">
          {/* Rulebook Upload Section */}
          <div className="bg-surface rounded-card border border-border p-6 sm:p-8 space-y-6 shadow-xs">
            <div>
              <h2 className="text-base font-extrabold text-text-primary flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <span>Upload Society Bylaws & Rulebook</span>
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Upload your society's official bylaws (.pdf, .txt) or paste text directly. The AI
                Rules Q&A assistant automatically references the latest version to answer resident questions.
              </p>
            </div>

            {rulebookError && (
              <Alert variant="error" className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{rulebookError}</span>
              </Alert>
            )}

            {rulebookSuccess && (
              <Alert variant="success" className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{rulebookSuccess}</span>
              </Alert>
            )}

            <form onSubmit={handleRulebookUpload} className="space-y-4">
              {/* File Upload Box */}
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Option A: Upload Document (.pdf or .txt, max 5MB)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.txt"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="block w-full text-xs text-text-secondary file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                  />
                  {selectedFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-xs text-status-escalated-text hover:underline shrink-0 font-medium"
                    >
                      Clear File
                    </button>
                  )}
                </div>
              </div>

              {/* Paste Text Area */}
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-2">
                  Option B: Or Paste Rulebook Text Directly
                </label>
                <textarea
                  rows={6}
                  value={rulebookText}
                  onChange={(e) => setRulebookText(e.target.value)}
                  placeholder="Paste society bylaws, parking guidelines, pet policies, clubhouse timings..."
                  className="app-input w-full p-4 rounded-control text-xs font-mono"
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isUploadingRulebook}
                className="flex items-center gap-2"
              >
                {isUploadingRulebook ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Uploading & Indexing...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Publish Rulebook Version</span>
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Secretary Only: Transfer Secretary Role */}
          {isSecretary && (
            <div className="bg-surface rounded-card border border-border p-6 sm:p-8 space-y-6 shadow-xs max-w-2xl">
              <div>
                <h2 className="text-base font-bold text-text flex items-center gap-2">
                  <Crown className="w-5 h-5 text-highlight-ink" />
                  <span>Transfer Secretary Role</span>
                </h2>
                <p className="text-xs text-muted mt-1">
                  Hand over the official Secretary title to another approved society resident or
                  committee member. You will automatically become a Committee member.
                </p>
              </div>

              {transferError && (
                <Alert variant="error" className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{transferError}</span>
                </Alert>
              )}

              {transferSuccess && (
                <Alert variant="success" className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{transferSuccess}</span>
                </Alert>
              )}

              <form onSubmit={handleTransferSecretarySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Select New Secretary
                  </label>
                  <select
                    value={selectedTransfereeId}
                    onChange={(e) => setSelectedTransfereeId(e.target.value)}
                    className="app-input w-full h-11 px-4 rounded-xl text-sm font-medium"
                  >
                    <option value="">-- Choose verified member --</option>
                    {eligibleTransferees.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (Flat {m.flat_no}, Block {m.block_no}) — {m.role}
                      </option>
                    ))}
                  </select>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isTransferringSecretary || !selectedTransfereeId}
                  className="flex items-center gap-2"
                >
                  {isTransferringSecretary ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Transferring Authority...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      <span>Confirm Secretary Handover</span>
                    </>
                  )}
                </Button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Reapproval Required Modal (Flat/Block change) */}
      {showReapprovalModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card max-w-md w-full p-6 shadow-soft border-[1.5px] border-border space-y-4">
            <div className="flex items-center gap-3 text-status-inprogress-text">
              <AlertTriangle className="w-7 h-7 shrink-0" />
              <h3 className="text-lg font-bold text-text">
                Secretary Re-Approval Required
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              You are changing your official residential unit to{' '}
              <strong className="text-text">
                Flat {pendingChanges?.flat_no}, Block {pendingChanges?.block_no}
              </strong>
              .
            </p>

            <div className="p-3.5 rounded-control bg-status-inprogress-bg border-[1.5px] border-status-inprogress-text/25 text-xs text-status-inprogress-text leading-relaxed">
              <strong>Notice:</strong> Changing your flat or block sends your account back to the
              Secretary's approval queue. You will be logged out immediately until the Secretary
              confirms your new unit allocation.
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReapprovalModal(false)}
                disabled={isSavingProfile}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSaveProfile(true)}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirm & Submit'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

