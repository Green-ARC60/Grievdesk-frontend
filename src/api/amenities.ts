import apiClient from './client';
import {
  Amenity,
  AmenityAvailabilityResponse,
  AmenityBooking,
  CreateAmenityPayload,
  CreateBookingPayload,
} from '../types/amenities';

export const getAmenitiesApi = async (): Promise<Amenity[]> => {
  const response = await apiClient.get<{ amenities: Amenity[] }>('/amenities');
  return response.data.amenities || [];
};

export const createAmenityApi = async (payload: CreateAmenityPayload): Promise<Amenity> => {
  const response = await apiClient.post<{ message: string; amenity: Amenity }>(
    '/amenities',
    payload
  );
  return response.data.amenity;
};

export const getAmenityAvailabilityApi = async (
  amenityId: number,
  date: string
): Promise<AmenityAvailabilityResponse> => {
  const response = await apiClient.get<AmenityAvailabilityResponse>(
    `/amenities/${amenityId}/availability`,
    { params: { date } }
  );
  return response.data;
};

export const createBookingApi = async (
  payload: CreateBookingPayload
): Promise<AmenityBooking> => {
  const response = await apiClient.post<{ message: string; booking: AmenityBooking }>(
    '/amenity-bookings',
    payload
  );
  return response.data.booking;
};

export const getMyBookingsApi = async (): Promise<AmenityBooking[]> => {
  const response = await apiClient.get<{ bookings: AmenityBooking[] }>(
    '/amenity-bookings/me'
  );
  return response.data.bookings || [];
};

export const getAllBookingsApi = async (params?: {
  date?: string;
  amenity_id?: number;
  status?: string;
}): Promise<AmenityBooking[]> => {
  const response = await apiClient.get<{ bookings: AmenityBooking[] }>(
    '/amenity-bookings',
    { params }
  );
  return response.data.bookings || [];
};

export const cancelBookingApi = async (
  bookingId: number
): Promise<{ message: string; booking: AmenityBooking }> => {
  const response = await apiClient.delete<{ message: string; booking: AmenityBooking }>(
    `/amenity-bookings/${bookingId}`
  );
  return response.data;
};

