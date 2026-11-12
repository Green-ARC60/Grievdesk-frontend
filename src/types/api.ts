export interface BackendErrorResponse {
  error?: string;
  message?: string;
  msg?: string; // Flask-JWT-Extended uses 'msg'
  fields?: string[];
  [key: string]: unknown;
}

export interface ApiClientConfig {
  baseURL?: string;
  onUnauthorized?: () => void;
}

