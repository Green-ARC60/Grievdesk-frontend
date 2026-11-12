import { AxiosError } from 'axios';
import { BackendErrorResponse } from '../types/api';

/**
 * Maps backend error codes or Axios exceptions into friendly, human-readable strings.
 */
export function mapBackendError(error: unknown): string {
  if (!error) return 'An unknown error occurred.';

  // If already a simple string
  if (typeof error === 'string') return error;

  const axiosError = error as AxiosError<BackendErrorResponse>;

  // Network or server unreachable error
  if (!axiosError.response) {
    if (axiosError.code === 'ERR_NETWORK') {
      return 'Unable to reach the GrievDesk server. Please verify the backend is running on port 5000.';
    }
    return axiosError.message || 'Network error occurred. Please check your connection.';
  }

  const { status, data } = axiosError.response;

  // Flask-JWT-Extended message
  if (data?.msg) {
    if (data.msg.toLowerCase().includes('expired')) {
      return 'Your session has expired. Please log in again.';
    }
    if (data.msg.toLowerCase().includes('token')) {
      return 'Invalid session token. Please log in again.';
    }
    return data.msg;
  }

  // Explicit message provided by backend
  if (data?.message) {
    return data.message;
  }

  // Error code mappings based on backend routes
  switch (data?.error) {
    case 'missing_fields':
      if (Array.isArray(data.fields) && data.fields.length > 0) {
        return `Please fill in all required fields: ${data.fields.join(', ')}.`;
      }
      return 'Please complete all required fields.';

    case 'invalid_credentials':
      return 'Invalid Gmail or password. Please check your credentials.';

    case 'pending_approval':
      return 'Your account is awaiting Secretary approval. You cannot log in until approved.';

    case 'email_already_registered':
      return 'This Gmail address is already registered. Please log in instead.';

    case 'secretary_already_exists':
      return 'An admin (Secretary) is already registered for this society. Only one Secretary can exist.';

    case 'weak_password':
      return 'Password must be at least 8 characters long.';

    case 'invalid_email':
      return 'Please enter a valid Gmail / email address.';

    case 'invalid_role':
      return 'Invalid role specified. Please choose Resident or Admin.';

    case 'unauthorized':
      return 'Your session has expired or account is not active. Please log in again.';

    case 'forbidden':
      return 'Access denied. You do not have permission for this action.';

    case 'user_not_found':
      return 'User account not found.';

    // AI & Gemini Errors
    case 'ai_not_configured':
      return 'AI Not Configured: GEMINI_API_KEY is missing from backend .env. Please configure your API key for AI categorization, bylaws Q&A, and speech translation.';

    case 'ai_call_failed':
      return 'The AI call failed. Please check your Gemini API key quota and network connectivity.';

    // Dues Management Errors
    case 'resident_not_found':
      return data?.message || 'No approved resident found matching that flat and block number.';

    case 'ambiguous_flat':
      return data?.message || 'Multiple residents live in that flat. Please select a specific resident.';

    case 'due_already_exists':
      return data?.message || 'A maintenance due record already exists for this resident and month.';

    case 'due_not_found':
      return 'The maintenance due record was not found.';

    case 'no_unpaid_dues':
      return data?.message || 'This resident has no unpaid dues on record.';

    // Amenity Booking Errors
    case 'slot_taken':
      return data?.message || 'That amenity slot is already booked for that time window on that day.';

    case 'booking_too_long':
      return data?.message || 'A booking can be at most 4 hours.';

    case 'in_the_past':
      return 'That booking time has already started or passed.';

    case 'too_far_ahead':
      return 'You can only reserve slots up to 30 days in advance.';

    case 'invalid_time_range':
      return 'The end time must be after the start time within the same day.';

    // Governance & User Errors
    case 'reapproval_required':
      return 'Changing your flat or block requires Secretary re-approval. You will be logged out until approved.';

    case 'not_approved':
      return 'This user registration is not yet approved.';

    case 'already_staff':
      return 'This user is already a member of the management committee.';

    case 'not_committee':
      return 'Only committee members can be demoted back to resident.';

    case 'already_secretary':
      return 'You already hold the Secretary role.';

    // Speech & Voice Errors (Phase 3)
    case 'no_speech_detected':
      return "No speech detected. I couldn't hear any intelligible speech in that recording. Please speak closer to your microphone and try again.";

    case 'speech_not_configured':
      return 'Voice processing is not configured on the server (GEMINI_API_KEY is missing in backend .env).';

    case 'speech_failed':
      return 'The speech-to-text translation failed. Please try speaking again or type your message.';

    case 'unsupported_audio_type':
      return 'Unsupported audio recording format. Please use a browser supporting WebM or OGG audio.';

    case 'audio_too_large':
      return 'The audio recording exceeds the maximum allowed file size. Please record a shorter voice note.';

    case 'empty_audio':
      return 'The audio recording was empty. Please check your microphone input and try again.';

    case 'text_and_audio':
      return 'Please send either text or a voice note, not both.';

    case 'missing_input':
      return 'Please provide text or record a voice note.';

    default:
      if (status === 400) return 'Invalid request. Please verify your input.';
      if (status === 401) return 'Authentication required. Please log in.';
      if (status === 403) return 'You do not have permission to perform this action.';
      if (status === 404) return 'The requested resource was not found.';
      if (status === 409) return 'A conflict occurred with existing data.';
      if (status >= 500) return 'A server error occurred. Please try again later.';
      return 'An unexpected error occurred. Please try again.';
  }
}

