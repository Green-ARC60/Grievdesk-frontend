import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, KeyRound, Lock, ArrowLeft, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import {
  sendForgotPasswordOtpApi,
  verifyForgotPasswordOtpApi,
  resetForgotPasswordApi,
} from '../api/auth';
import { mapBackendError } from '../api/errorMapper';

type Step = 'email' | 'otp' | 'new-password' | 'success';

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>('email');
  const [gmail, setGmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  // Resend cooldown timer in seconds
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Step 1: Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const emailTrimmed = gmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setError('Please enter your registered Gmail address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await sendForgotPasswordOtpApi(emailTrimmed);
      setSuccessInfo(res.message || `Verification code sent to ${emailTrimmed}.`);
      setStep('otp');
      setCountdown(60); // 60s cooldown
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const otpTrimmed = otp.trim();
    if (!otpTrimmed) {
      setError('Please enter the 6-digit verification code.');
      return;
    }
    if (otpTrimmed.length !== 6) {
      setError('The verification code must be exactly 6 digits.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await verifyForgotPasswordOtpApi(gmail.trim().toLowerCase(), otpTrimmed);
      setResetToken(res.reset_token);
      setSuccessInfo('Code confirmed! You may now set your new password.');
      setStep('new-password');
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newPassword) {
      setError('Please enter your new password.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsLoading(true);
    try {
      await resetForgotPasswordApi(resetToken, newPassword);
      setStep('success');
    } catch (err) {
      setError(mapBackendError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-accent selection:text-accent-text">
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        {/* Brand / Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-card bg-accent text-accent-text shadow-soft mb-3">
            <KeyRound className="w-6 h-6 text-current" />
          </div>
          <h1 className="text-24 sm:text-28 font-heading font-bold text-text tracking-tight">
            {step === 'success' ? 'Password Reset Complete' : 'Reset Your Password'}
          </h1>
          <p className="mt-1 text-xs text-muted">
            {step === 'email' && 'Verify your identity using an email verification code (OTP).'}
            {step === 'otp' && 'Enter the 6-digit code sent to your registered Gmail address.'}
            {step === 'new-password' && 'Choose a strong new password for your GrievDesk account.'}
            {step === 'success' && 'Your credentials have been securely updated.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface py-8 px-6 sm:px-8 shadow-soft border border-border rounded-card space-y-5 animate-fadeIn">
          {/* Alerts */}
          {error && (
            <Alert variant="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {successInfo && step !== 'success' && (
            <Alert variant="success" onClose={() => setSuccessInfo(null)}>
              {successInfo}
            </Alert>
          )}

          {/* STEP 1: ENTER GMAIL */}
          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <Input
                label="Registered Gmail Address"
                type="email"
                id="forgot-gmail"
                value={gmail}
                onChange={(e) => {
                  setGmail(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. resident@gmail.com"
                leftIcon={<Mail className="w-4 h-4" />}
                autoComplete="email"
                autoFocus
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
              >
                Send Verification Code
              </Button>

              <div className="pt-2 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-text font-medium transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}

          {/* STEP 2: ENTER OTP */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="p-3 bg-surface-2 rounded-control border border-border text-xs text-muted flex items-start justify-between gap-2">
                <div>
                  <span className="block text-[11px] uppercase tracking-wider text-muted font-semibold">Code Sent To</span>
                  <strong className="text-text font-medium">{gmail}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setError(null);
                  }}
                  className="text-accent text-[11px] font-semibold hover:underline"
                >
                  Change Email
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text mb-1">
                  6-Digit Verification Code (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(val);
                    if (error) setError(null);
                  }}
                  placeholder="------"
                  className="w-full text-center text-24 font-mono font-bold tracking-[0.4em] py-3 bg-surface border border-border rounded-control text-text focus:outline-none focus:border-accent"
                  autoFocus
                  required
                />
                <p className="text-[11px] text-muted mt-1 text-center">
                  Verification code expires in 10 minutes.
                </p>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                disabled={otp.trim().length !== 6}
              >
                Verify Code
              </Button>

              {/* Resend button */}
              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                  }}
                  className="inline-flex items-center gap-1 text-muted hover:text-text transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back
                </button>

                <button
                  type="button"
                  disabled={countdown > 0 || isLoading}
                  onClick={() => handleSendOtp()}
                  className={`inline-flex items-center gap-1 font-medium ${
                    countdown > 0 ? 'text-muted cursor-not-allowed' : 'text-accent hover:underline'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 'new-password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="At least 8 characters"
                leftIcon={<Lock className="w-4 h-4" />}
                allowPasswordToggle
                autoFocus
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Re-type new password"
                leftIcon={<Lock className="w-4 h-4" />}
                allowPasswordToggle
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Save New Password
              </Button>
            </form>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 rounded-full bg-status-resolved-bg text-status-resolved-text flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="font-heading font-semibold text-text text-base">All Set!</h3>
                <p className="text-xs text-muted max-w-xs mx-auto leading-relaxed">
                  Your password has been reset successfully. You can now log in to GrievDesk with your new credentials.
                </p>
              </div>

              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/login', { state: { notice: 'Password reset successful! Please sign in.' } })}
              >
                Sign In Now
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

