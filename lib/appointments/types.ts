export type Service = {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type AvailableSlot = {
  starts_at: string;
  ends_at: string;
  label: string;
};

export type AppointmentStatus = "confirmed" | "cancelled";

export type Appointment = {
  id: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  customer_notes: string | null;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  source: "online" | "manual";
  created_at: string;
  service?: {
    name: string;
    duration_minutes: number;
  } | null;
};

export type BusinessHour = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

export type BlockedPeriod = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
};

export type BookingConfirmation = {
  appointment_id: string;
  service_name: string;
  starts_at: string;
  ends_at: string;
};
