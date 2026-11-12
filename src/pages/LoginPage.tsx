import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { mapBackendError } from '../api/errorMapper';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ gmail?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check URL query parameters and router state for messages
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('expired') === '1') {
      setGeneralError('Your session has expired. Please log in again.');
    }

    const state = location.state as { notice?: string; registeredRole?: string } | undefined;
    if (state?.notice) {
      setSuccessNotice(state.notice);
    }
  }, [location]);

  const validate = (): boolean => {
    const newErrors: { gmail?: string; password?: string } = {};

    if (!gmail.trim()) {
      newErrors.gmail = 'Gmail address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(gmail.trim())) {
        newErrors.gmail = 'Please enter a valid Gmail / email address.';
      }
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setWarningMessage(null);

    if (!validate()) return;

    setIsLoading(true);
    try {
      await login({
        gmail: gmail.trim().toLowerCase(),
        password,
      });

      // Redirect to target or home
      const destination = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      // Check for pending approval specific error
      const errObj = err as { response?: { status?: number; data?: { error?: string; message?: string } } };
      if (errObj.response?.data?.error === 'pending_approval') {
        setWarningMessage(
          'Your registration is currently pending Secretary approval. You will be able to log in once the Secretary approves your flat registration.'
        );
      } else {
        setGeneralError(mapBackendError(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-bg text-text transition-colors">
      {/* Top Right Theme Toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8 animate-slideUp">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-card bg-accent text-accent-text shadow-soft mb-4">
            <Building2 className="w-6 h-6 text-current" />
          </div>
          <h1 className="text-28 sm:text-36 font-heading font-bold text-text tracking-tight leading-tight">
            Welcome to GrievDesk
          </h1>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2 mx-auto" aria-hidden="true" />
          <p className="mt-2 text-sm text-muted">
            Sign in to access your residential society services, complaints, and circulars.
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-surface py-8 px-6 sm:px-10 shadow-soft border-[1.5px] border-border rounded-card">
          {/* Notifications */}
          <div className="space-y-4 mb-6">
            {successNotice && (
              <Alert
                variant="success"
                title="Registration Received"
                onClose={() => setSuccessNotice(null)}
              >
                {successNotice}
              </Alert>
            )}

            {warningMessage && (
              <Alert
                variant="warning"
                title="Approval Pending"
                onClose={() => setWarningMessage(null)}
              >
                {warningMessage}
              </Alert>
            )}

            {generalError && (
              <Alert
                variant="error"
                title="Login Failed"
                onClose={() => setGeneralError(null)}
              >
                {generalError}
              </Alert>
            )}
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <Input
              label="Gmail Address"
              type="email"
              id="login-gmail"
              name="gmail"
              value={gmail}
              onChange={(e) => {
                setGmail(e.target.value);
                if (errors.gmail) setErrors((prev) => ({ ...prev, gmail: undefined }));
              }}
              error={errors.gmail}
              placeholder="e.g. resident@gmail.com"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              autoFocus
              required
            />

            <Input
              label="Password"
              type="password"
              id="login-password"
              name="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              }}
              error={errors.password}
              placeholder="Enter your password"
              leftIcon={<Lock className="w-4 h-4" />}
              allowPasswordToggle
              autoComplete="current-password"
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              leftIcon={<LogIn className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted">
              New to the society?{' '}
              <Link
                to="/register"
                className="font-semibold text-accent hover:underline transition-colors"
              >
                Register your flat
              </Link>
            </p>
          </div>
        </div>

        {/* Informational Scope Callout */}
        <div className="bg-surface-2 border border-border rounded-card p-4 text-xs text-muted flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-text">Single-Society Portal</p>
            <p className="mt-0.5 leading-relaxed">
              No society ID required. Registration is tied directly to your flat &amp; block. First admin registered becomes the Society Secretary.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

