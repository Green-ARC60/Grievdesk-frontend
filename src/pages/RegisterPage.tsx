import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  Home,
  Building,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { RegistrationRole, SUPPORTED_LANGUAGES } from '../types/auth';
import { mapBackendError } from '../api/errorMapper';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<RegistrationRole>('resident');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [flatNo, setFlatNo] = useState('');
  const [blockNo, setBlockNo] = useState('');
  const [gmail, setGmail] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('en');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Success view state
  const [registrationSuccess, setRegistrationSuccess] = useState<{
    role: RegistrationRole;
    message: string;
    userName: string;
  } | null>(null);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

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

    if (!flatNo.trim()) {
      newErrors.flat_no = 'Flat number is required.';
    }

    if (!blockNo.trim()) {
      newErrors.block_no = 'Block / Tower is required.';
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
        role,
        name: name.trim(),
        phone: phone.trim(),
        flat_no: flatNo.trim(),
        block_no: blockNo.trim(),
        gmail: gmail.trim().toLowerCase(),
        preferred_language: preferredLanguage,
        password,
      });

      setRegistrationSuccess({
        role,
        message: res.message,
        userName: res.user.name,
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
        <div className="max-w-md w-full bg-surface p-8 sm:p-10 border-[1.5px] border-border rounded-card shadow-soft text-center">
          <div
            className={`w-12 h-12 rounded-control mx-auto flex items-center justify-center mb-6 ${
              isResident
                ? 'bg-status-inprogress-bg text-status-inprogress-text'
                : 'bg-status-resolved-bg text-status-resolved-text'
            }`}
          >
            {isResident ? <Clock className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
          </div>

          <h2 className="text-20 sm:text-28 font-heading font-bold text-text tracking-tight mb-2">
            {isResident ? 'Registration Submitted' : 'Secretary Registered'}
          </h2>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2 mx-auto" aria-hidden="true" />

          <p className="text-sm font-medium text-muted mb-4">
            Hello, <span className="font-semibold text-text">{registrationSuccess.userName}</span>
          </p>

          <div
            className={`p-4 rounded-control text-sm mb-6 text-left leading-relaxed border ${
              isResident
                ? 'bg-status-inprogress-bg border-status-inprogress-text/20 text-status-inprogress-text'
                : 'bg-status-resolved-bg border-status-resolved-text/20 text-status-resolved-text'
            }`}
          >
            {isResident ? (
              <>
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-inprogress-text" />
                  Status: Pending Secretary Approval
                </p>
                <p className="text-xs opacity-90">
                  To prevent unauthorized flat claims, your resident registration requires verification
                  by the Society Secretary. Once approved, you can log in immediately.
                </p>
              </>
            ) : (
              <>
                <p className="font-semibold mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-status-resolved-text" />
                  Status: Active Secretary
                </p>
                <p className="text-xs opacity-90">
                  You are registered as the initial Society Secretary for this society. You can now log
                  in to manage society bylaws, resident approvals, announcements, and dues.
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
                  notice: isResident
                    ? 'Registration received. Awaiting Secretary approval before first login.'
                    : 'Secretary account ready. You may now log in.',
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
            <ShieldCheck className="w-6 h-6 text-current" />
          </div>
          <h1 className="text-28 sm:text-36 font-heading font-bold text-text tracking-tight leading-tight">
            Register Your Society Flat
          </h1>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2 mx-auto" aria-hidden="true" />
          <p className="mt-2 text-sm text-muted max-w-sm mx-auto">
            Join the society management portal. Submit complaints, receive dues notices, and access bylaws.
          </p>
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
            {/* 1. Role Selection */}
            <div>
              <label className="block text-sm font-semibold text-text mb-2">
                Registering As <span className="text-status-escalated-text">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('resident')}
                  className={`p-3.5 rounded-control border text-left transition-colors duration-180 ease-calm flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
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
                    <div className={`font-semibold text-sm ${role === 'resident' ? 'text-current' : 'text-text'}`}>Resident</div>
                    <div className={`text-xs mt-0.5 ${role === 'resident' ? 'text-current opacity-85' : 'text-muted'}`}>Flat owner or tenant</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-3.5 rounded-control border text-left transition-colors duration-180 ease-calm flex items-start gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                    role === 'admin'
                      ? 'border-accent bg-accent text-accent-text hover:bg-accent-hover active:bg-accent-active shadow-soft'
                      : 'border-border bg-surface-2 hover:bg-surface text-muted hover:text-text'
                  }`}
                >
                  <ShieldAlert
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      role === 'admin' ? 'text-current' : 'text-muted'
                    }`}
                  />
                  <div>
                    <div className={`font-semibold text-sm ${role === 'admin' ? 'text-current' : 'text-text'}`}>Admin (Secretary)</div>
                    <div className={`text-xs mt-0.5 ${role === 'admin' ? 'text-current opacity-85' : 'text-muted'}`}>Single society admin</div>
                  </div>
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                {role === 'admin'
                  ? 'Note: Only one Secretary can exist for the society. First registration is auto-approved.'
                  : 'Note: Resident accounts are pending Secretary approval before login.'}
              </p>
            </div>

            {/* 2. Full Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
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

            {/* 3. Flat Number & Block Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Flat Number"
                id="register-flat"
                name="flat_no"
                value={flatNo}
                onChange={(e) => {
                  setFlatNo(e.target.value);
                  if (errors.flat_no) setErrors((prev) => ({ ...prev, flat_no: '' }));
                }}
                error={errors.flat_no}
                placeholder="e.g. 402 or B-101"
                leftIcon={<Home className="w-4 h-4" />}
                required
              />

              <Input
                label="Block / Tower"
                id="register-block"
                name="block_no"
                value={blockNo}
                onChange={(e) => {
                  setBlockNo(e.target.value);
                  if (errors.block_no) setErrors((prev) => ({ ...prev, block_no: '' }));
                }}
                error={errors.block_no}
                placeholder="e.g. Block A or Tower 2"
                leftIcon={<Building className="w-4 h-4" />}
                required
              />
            </div>

            {/* 4. Gmail Address */}
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
              placeholder="e.g. ramesh@gmail.com"
              leftIcon={<Mail className="w-4 h-4" />}
              helperText="This Gmail address is used to sign in to GrievDesk."
              required
            />

            {/* 5. Preferred Language (Single select) */}
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

            {/* 6. Password & Confirm Password */}
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
              leftIcon={<ShieldCheck className="w-5 h-5" />}
            >
              {role === 'admin' ? 'Register as Secretary' : 'Submit Resident Registration'}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-6 border-t border-border text-center space-y-2">
            <p className="text-sm text-muted">
              Already have an account?{' '}
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

