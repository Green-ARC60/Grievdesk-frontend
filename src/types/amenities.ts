export interface Amenity {
  id: number;
  name: string;
  description?: string | null;
  created_at?: string;
}

export interface BookingSlot {
  start_time: string;
  end_time: string;
  mine: boolean;
  booked_by?: string;
}

export interface AmenityAvailabilityResponse {
  amenity: Amenity;
  date: string;
  booked: BookingSlot[];
}

export interface AmenityBooking {
  id: number;
  amenity_id: number;
  amenity: {
    id: number;
    name: string;
  };
  user_id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: 'booked' | 'cancelled';
  booked_by?: string;
  created_at?: string;
}

export interface CreateBookingPayload {
  amenity_id: number;
  date: string;
  start_time: string;
  end_time: string;
}

export interface CreateAmenityPayload {
  name: string;
  description?: string;
}

