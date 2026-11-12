export type Role = 'resident' | 'committee' | 'secretary';
export type RegistrationRole = 'resident' | 'admin';
export type ApprovalStatus = 'pending' | 'approved';

export interface User {
  id: number;
  name: string;
  phone?: string | null;
  gmail: string;
  flat_no: string;
  block_no: string;
  preferred_language: string;
  role: Role;
  approval_status: ApprovalStatus;
  share_phone?: boolean;
}

export interface LoginPayload {
  gmail: string;
  password: string;
}

export interface RegisterPayload {
  role: RegistrationRole;
  name: string;
  phone: string;
  flat_no: string;
  block_no: string;
  gmail: string;
  preferred_language: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface RegisterResponse {
  message: string;
  user: User;
}

export interface LanguageOption {
  code: string;
  label: string;
  nativeLabel: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
];

