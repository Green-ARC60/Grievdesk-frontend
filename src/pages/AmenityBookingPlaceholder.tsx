import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, ArrowLeft, Clock, Dumbbell } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const AmenityBookingPlaceholder: React.FC = () => {
  return (
    <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to AI Desk
          </Button>
        </Link>
      </div>

      <div className="bg-surface rounded-card border-[1.5px] border-border p-8 sm:p-12 text-center shadow-soft">
        <div className="w-16 h-16 rounded-card bg-accent/10 text-accent flex items-center justify-center mx-auto mb-5 border-[1.5px] border-accent/20">
          <CalendarDays className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-heading font-bold text-text tracking-tight mb-2">
          Amenity Booking
        </h1>
        <p className="text-sm text-muted max-w-lg mx-auto mb-6 leading-relaxed">
          Book community amenities (Clubhouse, Gym, Badminton Court, Community Hall) with conflict
          detection and slot reservation limits. Residents manage their own bookings; Staff can resolve
          scheduling disputes.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md mx-auto mb-8 text-xs font-semibold text-text">
          <div className="p-3 rounded-control bg-surface-2 border-[1.5px] border-border flex flex-col items-center gap-1">
            <Dumbbell className="w-5 h-5 text-accent" />
            <span>Gymnasium</span>
          </div>
          <div className="p-3 rounded-control bg-surface-2 border-[1.5px] border-border flex flex-col items-center gap-1">
            <Clock className="w-5 h-5 text-accent" />
            <span>Clubhouse</span>
          </div>
          <div className="p-3 rounded-control bg-surface-2 border-[1.5px] border-border flex flex-col items-center gap-1">
            <CalendarDays className="w-5 h-5 text-accent" />
            <span>Party Hall</span>
          </div>
          <div className="p-3 rounded-control bg-surface-2 border-[1.5px] border-border flex flex-col items-center gap-1">
            <CalendarDays className="w-5 h-5 text-accent" />
            <span>Sports Court</span>
          </div>
        </div>

        <Link to="/">
          <Button variant="primary">Return to Home</Button>
        </Link>
      </div>
    </div>
  );
};

