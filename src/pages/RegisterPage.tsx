import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  Home,
  Building,
  Building2,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Loader2,
  Check,
  Sparkles,
  Globe,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import {
  RegistrationRole,
  SUPPORTED_LANGUAGES,
  SocietyVerificationResponse,
  SocietyItem,
} from '../types/auth';
import { verifySocietyApi, listSocietiesApi } from '../api/auth';
import { mapBackendError } from '../api/errorMapper';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isNewSocietyMode = searchParams.get('mode') === 'new_society';

  const [role, setRole] = useState<RegistrationRole>(isNewSocietyMode ? 'admin' : 'resident');
  const [societyName, setSocietyName] = useState('');
  const [selectedSocietyId, setSelectedSocietyId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [blockNo, setBlockNo] = useState('');
  const [gmail, setGmail] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Societies list for dropdown
  const [societiesList, setSocietiesList] = useState<SocietyItem[]>([]);

  // Real-time society verification state
  const [isVerifyingSociety, setIsVerifyingSociety] = useState(false);
  const [societyInfo, setSocietyInfo] = useState<SocietyVerificationResponse | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync role with mode
  useEffect(() => {
    if (isNewSocietyMode) {
      setRole('admin');
      setSelectedSocietyId(null);
    } else {
      setRole('resident');
    }
    setErrors({});
    setGeneralError(null);
  }, [isNewSocietyMode]);

  // Load registered approved societies when in resident registration mode
  useEffect(() => {
    if (!isNewSocietyMode) {
      let isMounted = true;
      listSocietiesApi()
        .then((res) => {
          if (isMounted) {
            setSocietiesList(res.societies || []);
            // Pre-select first society if user hasn't typed anything
            if (res.societies && res.societies.length > 0 && !societyName) {
              setSocietyName(res.societies[0].name);
              setSelectedSocietyId(res.societies[0].id);
            }
          }
        })
        .catch(() => {
          // quiet catch
        });

      return () => {
        isMounted = false;
      };
    }
  }, [isNewSocietyMode]);

  // Debounced society name verification
  useEffect(() => {
    const trimmed = societyName.trim();
    if (!trimmed || trimmed.length < 2) {
      setSocietyInfo(null);
      setIsVerifyingSociety(false);
      return;
    }

    setIsVerifyingSociety(true);
    const timer = setTimeout(async () => {
      try {
        const info = await verifySocietyApi(trimmed);
        setSocietyInfo(info);
        if (info.society_id) {
          setSelectedSocietyId(info.society_id);
        }
        // If in resident mode and society already has an assigned Secretary, ensure role is resident
        if (!isNewSocietyMode && info.has_secretary) {
          setRole('resident');
        }
      } catch {
        // quiet catch
      } finally {
        setIsVerifyingSociety(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [societyName, isNewSocietyMode]);

  const isSecretaryDisabled = !isNewSocietyMode && Boolean(societyInfo?.has_secretary);
  const isSocietyNameTaken = isNewSocietyMode && Boolean(societyInfo?.exists);

  // Success view state
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    role: RegistrationRole;
    message: string;
    userName: string;
    societyName: string;
    isNewSociety: boolean;
  } | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!societyName.trim()) {
      newErrors.society_name = isNewSocietyMode
        ? 'Please enter the name of your new society.'
        : 'Please select or enter your society name.';
    } else if (isNewSocietyMode && isSocietyNameTaken) {
      newErrors.society_name = `A society named "${societyName.trim()}" already exists. Please choose a unique name.`;
    }

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Phone number is required.';
    } else {
      const phoneClean = phone.replace(/[\s\-()]/g, '');
      if (phoneClean.length < 8 || phoneClean.length > 15) {
        newErrors.phone = 'Please enter a valid phone number (8-15 digits).';
      }
    }

    if (altPhone.trim()) {
      const altClean = altPhone.replace(/[\s\-()]/g, '');
      if (altClean.length < 8 || altClean.length > 15) {
        newErrors.alt_phone = 'Please enter a valid alternate phone number (8-15 digits).';
      }
    }

    if (!flatNo.trim()) {
      newErrors.flat_no = isNewSocietyMode ? 'Office / Flat number is required.' : 'Flat number is required.';
    }

    if (!blockNo.trim()) {
      newErrors.block_no = isNewSocietyMode ? 'Block / Building is required.' : 'Block / Tower is required.';
    }

    if (!gmail.trim()) {
      newErrors.gmail = 'Gmail address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(gmail.trim())) {
        newErrors.gmail = 'Please enter a valid Gmail / email address.';
      }
    }

    if (!preferredLanguage) {
      newErrors.preferred_language = 'Please select your preferred language.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    }

    if (!confirmPassword) {
      newErrors.confirm_password = 'Confirm password is required.';
    } else if (password !== confirmPassword) {
      newErrors.confirm_password = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await register({
        role: isNewSocietyMode ? 'admin' : role,
        society_name: societyName.trim(),
        society_id: selectedSocietyId ?? undefined,
        name: name.trim(),
        phone: phone.trim(),
        alt_phone: altPhone.trim() || undefined,
        flat_no: flatNo.trim(),
        block_no: blockNo.trim(),
        gmail: gmail.trim().toLowerCase(),
        preferred_language: preferredLanguage,
        password,
        is_new_society: isNewSocietyMode,
      });

      setRegistrationSuccess({
        role: isNewSocietyMode ? 'admin' : role,
        message: res.message,
        userName: res.user.name,
        societyName: societyName.trim(),
        isNewSociety: isNewSocietyMode,
      });
    } catch (err: unknown) {
      setGeneralError(mapBackendError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Render registration confirmation screen once registered
  if (registrationSuccess) {
    const isResident = registrationSuccess.role === 'resident';

    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-bg text-text">
        <div className="max-w-md w-full bg-surface p-8 sm:p-10 border-[1.5px] border-border rounded-card shadow-soft text-center animate-slideUp">
          <div
            className={`w-12 h-12 rounded-control mx-auto flex items-center justify-center mb-6 ${
              registrationSuccess.isNewSociety
                ? 'bg-accent/15 text-accent'
                : isResident
                ? 'bg-status-inprogress-bg text-status-inprogress-text'
                : 'bg-status-resolved-bg text-status-resolved-text'
            }`}
          >
            {registrationSuccess.isNewSociety ? (
              <Building2 className="w-6 h-6" />
            ) : isResident ? (
              <Clock className="w-6 h-6" />
            ) : (
              <CheckCircle2 className="w-6 h-6" />
            )}
          </div>

          <h2 className="text-20 sm:text-28 font-heading font-bold text-text tracking-tight mb-2">
            {registrationSuccess.isNewSociety
              ? 'New Society Ecosystem Created'
              : isResident
              ? 'Registration Submitted'
              : 'Secretary Registered'}
          </h2>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2 mx-auto" aria-hidden="true" />

          <p className="text-sm font-medium text-muted mb-4">
            Hello, <span className="font-semibold text-text">{registrationSuccess.userName}</span>
          </p>

          <div
            className={`p-4 rounded-control text-sm mb-6 text-left leading-relaxed border ${
              registrationSuccess.isNewSociety
                ? 'bg-accent/10 border-accent/25 text-text'
                : isResident
                ? 'bg-status-inprogress-bg border-status-inprogress-text/20 text-status-inprogress-text'
                : 'bg-status-resolved-bg border-status-resolved-text/20 text-status-resolved-text'
            }`}
          >
            {registrationSuccess.isNewSociety ? (
              <>
                <p className="font-semibold mb-1 flex items-center gap-1.5 text-accent">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  Status: Pending Developer Onboarding Verification
                </p>
                <p className="text-xs opacity-90 leading-relaxed">
                  Your new society ecosystem <strong>"{registrationSuccess.societyName}"</strong> has been registered with you as Founding Secretary.
                  Your registration credentials have been forwarded to the GrievDesk platform developer.
                  Once verified, you will receive an official onboarding confirmation email via Resend and full access to invite committee members and residents.
                </p>
              </>
            ) : isResident ? (
              <>
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-inprogress-text" />
                  Status: Pending Secretary Approval
                </p>
                <p className="text-xs opacity-90 leading-relaxed">
                  Your resident registration for <strong>"{registrationSuccess.societyName}"</strong> has been submitted.
                  It requires approval by your Society Secretary before you can log in.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-inprogress-text" />
                  Status: Pending Developer Verification
                </p>
                <p className="text-xs opacity-90 leading-relaxed">
                  Your registration for <strong>"{registrationSuccess.societyName}"</strong> has been recorded and forwarded to the platform developer.
                </p>
              </>
            )}
          </div>

          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={() =>
              navigate('/login', {
                state: {
                  notice: registrationSuccess.isNewSociety
                    ? 'New society ecosystem created. Awaiting developer onboarding verification.'
                    : isResident
                    ? 'Registration received. Awaiting Secretary approval before first login.'
                    : 'Secretary registration received.',
                },
              })
            }
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Proceed to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-bg text-text transition-colors">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="max-w-xl w-full space-y-8 animate-slideUp">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-card bg-accent text-accent-text shadow-soft mb-4">
            {isNewSocietyMode ? (
              <Building2 className="w-6 h-6 text-current" />
            ) : (
              <ShieldCheck className="w-6 h-6 text-current" />
            )}
          </div>
          <h1 className="text-28 sm:text-36 font-heading font-bold text-text tracking-tight leading-tight">
            {isNewSocietyMode ? 'Create New Society Ecosystem' : 'Register Your Society Flat'}
          </h1>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2 mx-auto" aria-hidden="true" />
          <p className="mt-2 text-sm text-muted max-w-md mx-auto">
            {isNewSocietyMode
              ? 'Establish a completely isolated society portal with independent complaints, announcements, vendors, dues, and resident management.'
              : 'Join your residential society portal. Submit complaints, receive dues notices, and access bylaws.'}
          </p>

          {/* Mode Switch Pill */}
          <div className="mt-4 inline-flex items-center gap-2 p-1.5 rounded-full bg-surface-2 border border-border text-xs">
            {isNewSocietyMode ? (
              <>
                <span className="font-semibold text-accent px-2 py-0.5 rounded-full bg-accent/10 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> New Ecosystem
                </span>
                <span className="text-muted">Already an established society?</span>
                <button
                  type="button"
                  onClick={() => setSearchParams({})}
                  className="font-bold text-accent hover:underline mr-1"
                >
                  Register flat &rarr;
                </button>
              </>
            ) : (
              <>
                <span className="text-muted ml-1">Want to create for a new society?</span>
                <button
                  type="button"
                  onClick={() => setSearchParams({ mode: 'new_society' })}
                  className="font-bold text-highlight hover:underline px-2 py-0.5 rounded-full bg-highlight/10 flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" /> Create ecosystem &rarr;
                </button>
              </>
            )}
          </div>
        </div>

        {/* Card Form */}
        <div className="bg-surface py-8 px-6 sm:px-10 shadow-soft border-[1.5px] border-border rounded-card">
          {generalError && (
            <div className="mb-6">
              <Alert
                variant="error"
                title="Registration Error"
                onClose={() => setGeneralError(null)}
              >
                {generalError}
              </Alert>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
            {/* 1. Society Name / Society Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-text">
                  {isNewSocietyMode ? 'New Society Name' : 'Residential Society'} <span className="text-status-escalated-text">*</span>
                </label>
                {isVerifyingSociety ? (
                  <span className="text-xs text-muted flex items-center gap-1 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin text-accent" />
                    Verifying...
                  </span>
                ) : isNewSocietyMode ? (
                  isSocietyNameTaken ? (
                    <span className="text-xs font-semibold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      Already Registered
                    </span>
                  ) : societyName.trim().length >= 2 ? (
                    <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      Name Available
                    </span>
                  ) : null
                ) : societyInfo?.exists ? (
                  <span className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Verified Society
                  </span>
                ) : null}
              </div>

              {!isNewSocietyMode && societiesList.length > 0 ? (
                <div className="space-y-2">
                  <select
                    className="w-full px-3 py-2.5 rounded-control border-[1.5px] border-border bg-surface text-text text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-colors"
                    value={societyName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSocietyName(val);
                      const matched = societiesList.find((s) => s.name === val);
                      if (matched) {
                        setSelectedSocietyId(matched.id);
                      }
                      if (errors.society_name) setErrors((prev) => ({ ...prev, society_name: '' }));
                    }}
                  >
                    {societiesList.map((soc) => (
                      <option key={soc.id} value={soc.name}>
                        {soc.name} {soc.secretary_name ? `(Secretary: ${soc.secretary_name})` : ''}
                      </option>
                    ))}
                    <option value="__custom__">+ Other (Type manually below)</option>
                  </select>

                  {societyName === '__custom__' && (
                    <Input
                      id="register-society-custom"
                      name="society_name_custom"
                      value={societyName === '__custom__' ? '' : societyName}
                      onChange={(e) => {
                        setSocietyName(e.target.value);
                        setSelectedSocietyId(null);
                        if (errors.society_name) setErrors((prev) => ({ ...prev, society_name: '' }));
                      }}
                      error={errors.society_name}
                      placeholder="Type your society name"
                      leftIcon={<Building2 className="w-4 h-4" />}
                      required
                    />
                  )}
                </div>
              ) : (
                <Input
                  id="register-society"
                  name="society_name"
                  value={societyName}
                  onChange={(e) => {
                    setSocietyName(e.target.value);
                    if (errors.society_name) setErrors((prev) => ({ ...prev, society_name: '' }));
                  }}
                  error={errors.society_name}
                  placeholder={
                    isNewSocietyMode
                      ? 'e.g. Royal Palms Luxury Enclave'
                      : 'e.g. Greenwood Heights Society'
                  }
                  leftIcon={<Building2 className="w-4 h-4" />}
                  required
                />
              )}

              {/* Status Banners */}
              {isNewSocietyMode && isSocietyNameTaken && (
                <div className="mt-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-500 flex items-start gap-2 shadow-2xs">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    A society named <strong>"{societyInfo?.society_name || societyName}"</strong> already exists. Please choose a different society name or register your flat as a resident.
                  </div>
                </div>
              )}

              {isNewSocietyMode && !isSocietyNameTaken && societyName.trim().length >= 2 && !isVerifyingSociety && (
                <div className="mt-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2 shadow-2xs">
                  <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  <div>
                    Ecosystem name available. You will be registered as the <strong>Founding Secretary</strong> for this new ecosystem.
                  </div>
                </div>
              )}

              {!isNewSocietyMode && societyInfo?.exists && societyInfo.has_secretary && (
                <div className="mt-2.5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 dark:text-emerald-400 flex items-start gap-2 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-500" />
                  <div>
                    <span className="font-bold">{societyInfo.society_name}</span> is managed by Secretary{' '}
                    <strong>{societyInfo.secretary_name}</strong>.
                    <p className="mt-0.5 text-[11px] opacity-90">
                      Secretary position is already filled. You can join this society as a Resident below.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Role Selection */}
            {isNewSocietyMode ? (
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Role in New Society Ecosystem <span className="text-status-escalated-text">*</span>
                </label>
                <div className="p-3.5 rounded-control border border-accent bg-accent/10 text-text flex items-start gap-3 shadow-soft">
                  <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-accent" />
                  <div>
                    <div className="font-semibold text-sm text-accent">Founding Society Secretary (Admin)</div>
                    <div className="text-xs mt-0.5 text-muted leading-relaxed">
                      As creator of this ecosystem, you will receive administrative access to approve resident flat registrations, assign committee members, manage dues, and post circulars.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-text mb-2">
                  Registering As <span className="text-status-escalated-text">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* Resident Option */}
                  <button
                    type="button"
                    onClick={() => setRole('resident')}
                    className={`p-3.5 rounded-control border text-left transition-all duration-180 ease-calm flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      role === 'resident'
                        ? 'border-accent bg-accent text-accent-text hover:bg-accent-hover active:bg-accent-active shadow-soft'
                        : 'border-border bg-surface-2 hover:bg-surface text-muted hover:text-text'
                    }`}
                  >
                    <Home
                      className={`w-5 h-5 shrink-0 mt-0.5 ${
                        role === 'resident' ? 'text-current' : 'text-muted'
                      }`}
                    />
                    <div>
                      <div className={`font-semibold text-sm ${role === 'resident' ? 'text-current' : 'text-text'}`}>
                        Resident
                      </div>
                      <div className={`text-xs mt-0.5 ${role === 'resident' ? 'text-current opacity-85' : 'text-muted'}`}>
                        Flat owner or tenant
                      </div>
                    </div>
                  </button>

                  {/* Admin (Secretary) Option - Faded / Disabled when Secretary Already Exists */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isSecretaryDisabled) setRole('admin');
                      }}
                      disabled={isSecretaryDisabled}
                      className={`w-full p-3.5 rounded-control border text-left transition-all duration-180 ease-calm flex items-start gap-3 focus:outline-none ${
                        isSecretaryDisabled
                          ? 'opacity-40 cursor-not-allowed border-border/70 bg-surface-2/60 pointer-events-none filter grayscale-[40%]'
                          : role === 'admin'
                          ? 'border-accent bg-accent text-accent-text hover:bg-accent-hover active:bg-accent-active shadow-soft'
                          : 'border-border bg-surface-2 hover:bg-surface text-muted hover:text-text'
                      }`}
                    >
                      <ShieldAlert
                        className={`w-5 h-5 shrink-0 mt-0.5 ${
                          role === 'admin' && !isSecretaryDisabled ? 'text-current' : 'text-muted'
                        }`}
                      />
                      <div>
                        <div
                          className={`font-semibold text-sm ${
                            role === 'admin' && !isSecretaryDisabled ? 'text-current' : 'text-text'
                          }`}
                        >
                          Admin (Secretary)
                        </div>
                        <div
                          className={`text-xs mt-0.5 ${
                            role === 'admin' && !isSecretaryDisabled ? 'text-current opacity-85' : 'text-muted'
                          }`}
                        >
                          {isSecretaryDisabled ? 'Already assigned' : 'Single society admin'}
                        </div>
                      </div>
                    </button>

                    {/* Faded overlay indicator badge */}
                    {isSecretaryDisabled && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-2xs">
                        Assigned
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 text-xs text-muted">
                  {isSecretaryDisabled
                    ? 'Note: This society already has an assigned Secretary. Only Residents can register for this society.'
                    : 'Note: Resident accounts are pending Secretary approval before first login.'}
                </p>
              </div>
            )}

            {/* 3. Full Name & Primary Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isNewSocietyMode ? 'Secretary Full Name' : 'Full Name'}
                id="register-name"
                name="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                }}
                error={errors.name}
                placeholder="e.g. Ramesh Patel"
                leftIcon={<UserIcon className="w-4 h-4" />}
                required
              />

              <Input
                label="Phone Number"
                type="tel"
                id="register-phone"
                name="phone"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (errors.phone) setErrors((prev) => ({ ...prev, phone: '' }));
                }}
                error={errors.phone}
                placeholder="e.g. +91 9876543210"
                leftIcon={<Phone className="w-4 h-4" />}
                required
              />
            </div>

            {/* 4. Alternate Phone Number (Optional) */}
            <Input
              label="Alternate Phone Number (Optional)"
              type="tel"
              id="register-alt-phone"
              name="alt_phone"
              value={altPhone}
              onChange={(e) => {
                setAltPhone(e.target.value);
                if (errors.alt_phone) setErrors((prev) => ({ ...prev, alt_phone: '' }));
              }}
              error={errors.alt_phone}
              placeholder="e.g. +91 9123456780"
              leftIcon={<Phone className="w-4 h-4" />}
              helperText="Secondary contact number visible in directory if you choose to share."
            />

            {/* 5. Flat Number & Block Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isNewSocietyMode ? 'Secretary Flat / Office No.' : 'Flat Number'}
                id="register-flat"
                name="flat_no"
                value={flatNo}
                onChange={(e) => {
                  setFlatNo(e.target.value);
                  if (errors.flat_no) setErrors((prev) => ({ ...prev, flat_no: '' }));
                }}
                error={errors.flat_no}
                placeholder={isNewSocietyMode ? 'e.g. Sec-Office or 101' : 'e.g. 402 or B-101'}
                leftIcon={<Home className="w-4 h-4" />}
                required
              />

              <Input
                label={isNewSocietyMode ? 'Block / Building / Wing' : 'Block / Tower'}
                id="register-block"
                name="block_no"
                value={blockNo}
                onChange={(e) => {
                  setBlockNo(e.target.value);
                  if (errors.block_no) setErrors((prev) => ({ ...prev, block_no: '' }));
                }}
                error={errors.block_no}
                placeholder={isNewSocietyMode ? 'e.g. Main or Tower A' : 'e.g. Block A or Tower 2'}
                leftIcon={<Building className="w-4 h-4" />}
                required
              />
            </div>

            {/* 6. Gmail Address */}
            <Input
              label="Gmail Address (Login Identifier)"
              type="email"
              id="register-gmail"
              name="gmail"
              value={gmail}
              onChange={(e) => {
                setGmail(e.target.value);
                if (errors.gmail) setErrors((prev) => ({ ...prev, gmail: '' }));
              }}
              error={errors.gmail}
              placeholder="e.g. secretary@gmail.com"
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="This Gmail address is used to sign in to GrievDesk."
              required
            />

            {/* 7. Preferred Language */}
            <div>
              <Select
                label="Preferred Language (Translate on Read)"
                id="register-language"
                name="preferred_language"
                value={preferredLanguage}
                onChange={(e) => {
                  setPreferredLanguage(e.target.value);
                  if (errors.preferred_language) {
                    setErrors((prev) => ({ ...prev, preferred_language: '' }));
                  }
                }}
                error={errors.preferred_language}
                options={SUPPORTED_LANGUAGES.map((l) => ({
                  value: l.code,
                  label: l.label,
                  secondaryLabel: l.nativeLabel !== l.label ? l.nativeLabel : undefined,
                }))}
                helperText="All society complaints and notices will be presented in your preferred language."
                required
              />
            </div>

            {/* 8. Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password"
                type="password"
                id="register-password"
                name="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: '' }));
                }}
                error={errors.password}
                placeholder="At least 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                allowPasswordToggle
                required
              />

              <Input
                label="Confirm Password"
                type="password"
                id="register-confirm-password"
                name="confirm_password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirm_password) {
                    setErrors((prev) => ({ ...prev, confirm_password: '' }));
                  }
                }}
                error={errors.confirm_password}
                placeholder="Re-type password"
                leftIcon={<Lock className="w-4 h-4" />}
                allowPasswordToggle
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              disabled={isNewSocietyMode && isSocietyNameTaken}
              leftIcon={isNewSocietyMode ? <Building2 className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            >
              {isNewSocietyMode ? 'Create Society Ecosystem' : 'Submit Resident Registration'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-border text-center space-y-2">
            <p className="text-sm text-muted">
              Already registered for this society?{' '}
              <Link
                to="/login"
                className="font-semibold text-accent hover:underline transition-colors"
              >
                Sign in here
              </Link>
            </p>
            <p className="text-xs text-muted">
              Forgot your existing password?{' '}
              <Link to="/forgot-password" className="text-accent hover:underline font-medium">
                Reset it here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
