import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  RotateCcw,
  Trash2,
  Shield,
  Loader2,
  CalendarDays,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  Amenity,
  AmenityBooking,
  BookingSlot,
} from '../types/amenities';
import {
  getAmenitiesApi,
  createAmenityApi,
  getAmenityAvailabilityApi,
  createBookingApi,
  getMyBookingsApi,
  getAllBookingsApi,
  cancelBookingApi,
} from '../api/amenities';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { TableSkeleton } from '../components/ui/Skeleton';
import { mapBackendError } from '../api/errorMapper';

export const AmenityBookingPage: React.FC = () => {
  const { isCommitteeOrAbove } = useAuth();

  const [activeTab, setActiveTab] = useState<'book' | 'my-bookings' | 'society-bookings'>('book');

  // Amenities list
  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [selectedAmenityId, setSelectedAmenityId] = useState<number | null>(null);
  const [isLoadingAmenities, setIsLoadingAmenities] = useState(true);

  // Availability / Booking State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const [bookedSlots, setBookedSlots] = useState<BookingSlot[]>([]);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  // New Booking Inputs
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // My Bookings
  const [myBookings, setMyBookings] = useState<AmenityBooking[]>([]);
  const [isLoadingMyBookings, setIsLoadingMyBookings] = useState(false);

  // Staff All Bookings
  const [allBookings, setAllBookings] = useState<AmenityBooking[]>([]);
  const [isLoadingAllBookings, setIsLoadingAllBookings] = useState(false);
  const [staffFilterDate, setStaffFilterDate] = useState('');
  const [staffFilterStatus, setStaffFilterStatus] = useState('');

  // Action states
  const [cancellingBookingId, setCancellingBookingId] = useState<number | null>(null);

  // Staff: Create New Amenity Modal
  const [isCreateAmenityOpen, setIsCreateAmenityOpen] = useState(false);
  const [newAmenityName, setNewAmenityName] = useState('');
  const [newAmenityDescription, setNewAmenityDescription] = useState('');
  const [isCreatingAmenity, setIsCreatingAmenity] = useState(false);
  const [createAmenityError, setCreateAmenityError] = useState<string | null>(null);

  // ----------------------------------------------------
  // Fetch Amenities
  // ----------------------------------------------------
  const fetchAmenities = useCallback(async () => {
    setIsLoadingAmenities(true);
    try {
      const data = await getAmenitiesApi();
      setAmenities(data);
      if (data.length > 0 && !selectedAmenityId) {
        setSelectedAmenityId(data[0].id);
      }
    } catch {
      // quiet catch
    } finally {
      setIsLoadingAmenities(false);
    }
  }, [selectedAmenityId]);

  useEffect(() => {
    fetchAmenities();
  }, [fetchAmenities]);

  // ----------------------------------------------------
  // Fetch Availability for Selected Amenity & Date
  // ----------------------------------------------------
  const fetchAvailability = useCallback(async () => {
    if (!selectedAmenityId || !selectedDate) return;
    setIsLoadingAvailability(true);
    try {
      const res = await getAmenityAvailabilityApi(selectedAmenityId, selectedDate);
      setBookedSlots(res.booked || []);
    } catch {
      setBookedSlots([]);
    } finally {
      setIsLoadingAvailability(false);
    }
  }, [selectedAmenityId, selectedDate]);

  useEffect(() => {
    if (activeTab === 'book') {
      fetchAvailability();
    }
  }, [activeTab, fetchAvailability]);

  // ----------------------------------------------------
  // Fetch My Bookings
  // ----------------------------------------------------
  const fetchMyBookings = useCallback(async () => {
    setIsLoadingMyBookings(true);
    try {
      const data = await getMyBookingsApi();
      setMyBookings(data);
    } catch {
      setMyBookings([]);
    } finally {
      setIsLoadingMyBookings(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'my-bookings') {
      fetchMyBookings();
    }
  }, [activeTab, fetchMyBookings]);

  // ----------------------------------------------------
  // Fetch Staff All Bookings
  // ----------------------------------------------------
  const fetchAllBookings = useCallback(async () => {
    if (!isCommitteeOrAbove) return;
    setIsLoadingAllBookings(true);
    try {
      const data = await getAllBookingsApi({
        date: staffFilterDate || undefined,
        status: staffFilterStatus || undefined,
      });
      setAllBookings(data);
    } catch {
      setAllBookings([]);
    } finally {
      setIsLoadingAllBookings(false);
    }
  }, [isCommitteeOrAbove, staffFilterDate, staffFilterStatus]);

  useEffect(() => {
    if (activeTab === 'society-bookings') {
      fetchAllBookings();
    }
  }, [activeTab, fetchAllBookings]);

  // ----------------------------------------------------
  // Handle Create Booking
  // ----------------------------------------------------
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAmenityId) return;

    setBookingError(null);
    setBookingSuccess(null);
    setIsBooking(true);

    try {
      const booking = await createBookingApi({
        amenity_id: selectedAmenityId,
        date: selectedDate,
        start_time: startTime,
        end_time: endTime,
      });
      setBookingSuccess(
        `Successfully booked ${booking.amenity?.name || 'Amenity'} on ${booking.date} (${booking.start_time} - ${booking.end_time})!`
      );
      await fetchAvailability();
    } catch (err) {
      setBookingError(mapBackendError(err));
    } finally {
      setIsBooking(false);
    }
  };

  // ----------------------------------------------------
  // Handle Cancel Booking
  // ----------------------------------------------------
  const handleCancelBooking = async (bookingId: number) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    setCancellingBookingId(bookingId);
    try {
      await cancelBookingApi(bookingId);
      if (activeTab === 'my-bookings') {
        await fetchMyBookings();
      } else if (activeTab === 'society-bookings') {
        await fetchAllBookings();
      }
      await fetchAvailability();
    } catch (err) {
      alert(mapBackendError(err));
    } finally {
      setCancellingBookingId(null);
    }
  };

  // ----------------------------------------------------
  // Handle Create Amenity (Staff)
  // ----------------------------------------------------
  const handleCreateAmenitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateAmenityError(null);
    if (!newAmenityName.trim()) {
      setCreateAmenityError('Amenity name is required.');
      return;
    }

    setIsCreatingAmenity(true);
    try {
      const created = await createAmenityApi({
        name: newAmenityName.trim(),
        description: newAmenityDescription.trim() || undefined,
      });
      setAmenities((prev) => [...prev, created]);
      setSelectedAmenityId(created.id);
      setIsCreateAmenityOpen(false);
      setNewAmenityName('');
      setNewAmenityDescription('');
    } catch (err) {
      setCreateAmenityError(mapBackendError(err));
    } finally {
      setIsCreatingAmenity(false);
    }
  };

  const selectedAmenity = amenities.find((a) => a.id === selectedAmenityId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-24 sm:text-30 font-heading font-bold text-text tracking-tight">
            Amenity Bookings
          </h1>
          <div className="w-12 h-1 bg-highlight rounded-full mt-2 mb-2.5" aria-hidden="true" />
          <p className="text-xs sm:text-sm text-muted mt-1">
            Reserve society facilities like the Clubhouse, Badminton Court, Party Hall, or Pool.
          </p>
        </div>

        {/* Staff Add Amenity Button */}
        {isCommitteeOrAbove && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateAmenityOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="self-start sm:self-auto"
          >
            Add New Amenity
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('book')}
          className={`px-3.5 py-2 text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'book'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-text font-medium'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Book a Slot</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('my-bookings')}
          className={`px-3.5 py-2 text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'my-bookings'
              ? 'border-accent text-accent font-semibold'
              : 'border-transparent text-muted hover:text-text font-medium'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Reservations</span>
        </button>

        {isCommitteeOrAbove && (
          <button
            type="button"
            onClick={() => setActiveTab('society-bookings')}
            className={`px-3.5 py-2 text-xs sm:text-sm border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'society-bookings'
                ? 'border-accent text-accent font-semibold'
                : 'border-transparent text-muted hover:text-text font-medium'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>All Society Bookings</span>
          </button>
        )}
      </div>

      {/* -------------------------------------------------- */}
      {/* TAB 1: BOOK A SLOT */}
      {/* -------------------------------------------------- */}
      {activeTab === 'book' && (
        <div className="space-y-6">
          {isLoadingAmenities ? (
            <div className="py-20 flex justify-center text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : amenities.length === 0 ? (
            <div className="py-16 text-center bg-surface rounded-card border-[1.5px] border-border shadow-soft p-8 space-y-3">
              <CalendarDays className="w-10 h-10 text-muted mx-auto" />
              <h3 className="font-bold text-text text-base">No Amenities Listed Yet</h3>
              <p className="text-xs text-muted max-w-sm mx-auto">
                The management committee has not added any bookable society amenities yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Amenity Selection Cards */}
              <div className="space-y-3 lg:col-span-1">
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider">
                  Select Facility
                </label>
                <div className="space-y-2">
                  {amenities.map((amenity) => {
                    const isSelected = amenity.id === selectedAmenityId;
                    return (
                      <div
                        key={amenity.id}
                        onClick={() => setSelectedAmenityId(amenity.id)}
                        className={`p-4 rounded-card border cursor-pointer transition-colors duration-150 ${
                          isSelected
                            ? 'border-accent bg-surface-2 shadow-soft ring-1 ring-accent/30'
                            : 'border-border bg-surface hover:border-accent/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-text-primary text-sm">{amenity.name}</h4>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          )}
                        </div>
                        {amenity.description && (
                          <p className="text-xs text-text-muted mt-1 line-clamp-2">
                            {amenity.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Middle & Right: Date Picker, Slots & Booking Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* Booking Form Card */}
                <div className="bg-surface rounded-card border border-border p-6 sm:p-7 shadow-xs space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h3 className="font-extrabold text-text-primary text-base">
                        Reserve {selectedAmenity?.name}
                      </h3>
                      <p className="text-xs text-text-muted mt-0.5">
                        Choose your preferred date and time slot.
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={fetchAvailability}
                      disabled={isLoadingAvailability}
                      className="text-xs text-text-muted hover:text-text-primary"
                    >
                      <RotateCcw
                        className={`w-3.5 h-3.5 mr-1 ${
                          isLoadingAvailability ? 'animate-spin' : ''
                        }`}
                      />
                      Refresh Slots
                    </Button>
                  </div>

                  {bookingError && (
                    <Alert variant="error" className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <span>{bookingError}</span>
                    </Alert>
                  )}

                  {bookingSuccess && (
                    <Alert variant="success" className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 shrink-0" />
                      <span>{bookingSuccess}</span>
                    </Alert>
                  )}

                  <form onSubmit={handleCreateBooking} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Date Input */}
                      <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                          Date
                        </label>
                        <Input
                          type="date"
                          value={selectedDate}
                          min={new Date().toISOString().slice(0, 10)}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          required
                          className="h-10 text-xs"
                        />
                      </div>

                      {/* Start Time */}
                      <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                          Start Time
                        </label>
                        <Input
                          type="time"
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          required
                          className="h-10 text-xs"
                        />
                      </div>

                      {/* End Time */}
                      <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                          End Time
                        </label>
                        <Input
                          type="time"
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          required
                          className="h-10 text-xs"
                        />
                      </div>
                    </div>

                    {/* Live Conflict & Booked Slots Indicator */}
                    <div className="p-4 rounded-control bg-surface-2 border-[1.5px] border-border space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-text">
                        <span>Already Booked on {selectedDate}:</span>
                        <span>{bookedSlots.length} slot(s)</span>
                      </div>

                      {isLoadingAvailability ? (
                        <div className="py-2 text-center text-xs text-muted flex items-center justify-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
                          Checking live availability...
                        </div>
                      ) : bookedSlots.length === 0 ? (
                        <p className="text-xs text-status-resolved-text font-medium">
                          ✓ All slots are currently open and available on this date!
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {bookedSlots.map((slot, idx) => (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg font-mono font-medium ${
                                slot.mine ? 'slot-badge-mine' : 'slot-badge-booked'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {slot.start_time} - {slot.end_time}
                              {slot.mine && ' (You)'}
                              {slot.booked_by && ` (${slot.booked_by})`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        type="submit"
                        variant="primary"
                        size="md"
                        disabled={isBooking}
                        className="flex items-center gap-2"
                      >
                        {isBooking ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Confirming Booking...</span>
                          </>
                        ) : (
                          <>
                            <CalendarCheck className="w-4 h-4" />
                            <span>Book Amenity Now</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* TAB 2: MY RESERVATIONS */}
      {/* -------------------------------------------------- */}
      {activeTab === 'my-bookings' && (
        <div className="bg-surface rounded-card border border-border p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-text-primary">My Facility Bookings</h2>
              <p className="text-xs text-text-muted mt-0.5">
                Review your upcoming and previous reservations.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMyBookings}
              disabled={isLoadingMyBookings}
              className="text-xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 mr-1 ${isLoadingMyBookings ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {isLoadingMyBookings ? (
            <TableSkeleton rows={3} />
          ) : myBookings.length === 0 ? (
            <div className="border border-border rounded-card bg-surface">
              <EmptyState message="You haven't booked any amenities yet." />
            </div>
          ) : (
            <div className="border border-border rounded-card bg-surface divide-y divide-border overflow-hidden">
              {myBookings.map((b) => {
                const isCancelled = b.status === 'cancelled';
                return (
                  <div
                    key={b.id}
                    className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-2/60 transition-colors duration-150 ${
                      isCancelled ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text text-sm">
                          {b.amenity?.name || 'Amenity'}
                        </span>
                        <StatusBadge
                          status={isCancelled ? 'Cancelled' : 'Booked'}
                          variant={isCancelled ? 'neutral' : 'resolved'}
                          size="sm"
                        />
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted font-mono">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" />
                          {b.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {b.start_time} - {b.end_time}
                        </span>
                      </div>
                    </div>

                    {!isCancelled && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelBooking(b.id)}
                        disabled={cancellingBookingId === b.id}
                        className="text-xs text-status-escalated-text border-status-escalated-text/30 hover:bg-status-escalated-bg self-end sm:self-auto"
                      >
                        {cancellingBookingId === b.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <span className="flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Cancel Slot
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* TAB 3: STAFF ALL SOCIETY BOOKINGS */}
      {/* -------------------------------------------------- */}
      {activeTab === 'society-bookings' && isCommitteeOrAbove && (
        <div className="space-y-4">
          <div className="bg-surface rounded-card border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-heading font-semibold text-text text-base">
                All Society Facility Bookings
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Staff view to inspect schedules, resolve conflicts, and cancel slots.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={staffFilterDate}
                onChange={(e) => setStaffFilterDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
              <select
                value={staffFilterStatus}
                onChange={(e) => setStaffFilterStatus(e.target.value)}
                className="app-input h-8 px-2 rounded-control text-xs"
              >
                <option value="">All Statuses</option>
                <option value="booked">Booked</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchAllBookings}
                disabled={isLoadingAllBookings}
                className="text-xs"
              >
                Filter
              </Button>
            </div>
          </div>

          {isLoadingAllBookings ? (
            <TableSkeleton rows={4} />
          ) : allBookings.length === 0 ? (
            <div className="border border-border rounded-card bg-surface">
              <EmptyState message="No society bookings match the filter criteria." />
            </div>
          ) : (
            <div className="border border-border rounded-card bg-surface divide-y divide-border overflow-hidden">
              {allBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-2/60 transition-colors duration-150"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text text-sm">
                        {b.amenity?.name}
                      </span>
                      <StatusBadge
                        status={b.status === 'cancelled' ? 'Cancelled' : 'Booked'}
                        variant={b.status === 'cancelled' ? 'neutral' : 'resolved'}
                        size="sm"
                      />
                    </div>
                    <div className="text-xs text-muted flex flex-wrap gap-x-4 gap-y-1 font-mono">
                      <span>{b.date}</span>
                      <span>
                        {b.start_time} - {b.end_time}
                      </span>
                      {b.booked_by && (
                        <span className="text-text font-medium">
                          Booked by: {b.booked_by}
                        </span>
                      )}
                    </div>
                  </div>

                  {b.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelBooking(b.id)}
                      disabled={cancellingBookingId === b.id}
                      className="text-xs text-status-escalated-text border-status-escalated-text/30 hover:bg-status-escalated-bg self-end sm:self-auto"
                    >
                      {cancellingBookingId === b.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        'Cancel as Staff'
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create Amenity Modal (Staff) */}
      {isCreateAmenityOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-card max-w-md w-full p-6 shadow-soft border border-border space-y-4">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-6 h-6 text-primary shrink-0" />
              <h3 className="text-lg font-extrabold text-text-primary">Add Society Amenity</h3>
            </div>

            {createAmenityError && (
              <Alert variant="error" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createAmenityError}</span>
              </Alert>
            )}

            <form onSubmit={handleCreateAmenitySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Amenity Name
                </label>
                <Input
                  value={newAmenityName}
                  onChange={(e) => setNewAmenityName(e.target.value)}
                  placeholder="e.g. Badminton Court, Clubhouse"
                  required
                  className="h-10 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                  Description / Guidelines
                </label>
                <textarea
                  rows={3}
                  value={newAmenityDescription}
                  onChange={(e) => setNewAmenityDescription(e.target.value)}
                  placeholder="Max 2 hours, please carry your own rackets..."
                  className="app-input w-full p-3 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateAmenityOpen(false)}
                  disabled={isCreatingAmenity}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isCreatingAmenity}
                >
                  {isCreatingAmenity ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Create Facility'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
