export type TransmissionType = "AUTOMATIC" | "MANUAL" | "LUXURY_EV";

export type PoliceVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

export type SaarthiTripStatus =
  | "REQUESTED"
  | "ACCEPTED"
  | "ARRIVED_AT_VALET"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export interface SaarthiDriver {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  dl_number: string;
  dl_expiry: string;
  pcc_certificate_url: string | null;
  police_verification_status: PoliceVerificationStatus;
  transmission_specialties: TransmissionType[];
  is_online: boolean;
  current_lat: number | null;
  current_lng: number | null;
  rating: number;
  total_trips_completed: number;
}

export interface SaarthiTrip {
  id: string;
  guest_id: string | null;
  guest_name: string;
  guest_phone: string;
  venue_id: string;
  car_brand: string;
  car_model: string;
  transmission_type: TransmissionType;
  pickup_venue_name: string;
  drop_address: string;
  base_fare: number;
  surge_fare: number;
  total_fare: number;
  trip_otp: string;
  assigned_driver_id: string | null;
  trip_status: SaarthiTripStatus;
  pre_trip_inspection_photos: string[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export const SAARTHI_BASE_FARE = 899;

export const CAR_CATALOG: {
  brand: string;
  models: { name: string; transmission: TransmissionType }[];
}[] = [
  {
    brand: "Mercedes-Benz",
    models: [
      { name: "GLA 200d", transmission: "AUTOMATIC" },
      { name: "C 300e", transmission: "LUXURY_EV" },
      { name: "S-Class", transmission: "AUTOMATIC" },
    ],
  },
  {
    brand: "BMW",
    models: [
      { name: "330i", transmission: "AUTOMATIC" },
      { name: "iX1", transmission: "LUXURY_EV" },
      { name: "X5", transmission: "AUTOMATIC" },
    ],
  },
  {
    brand: "Audi",
    models: [
      { name: "A4", transmission: "AUTOMATIC" },
      { name: "Q8 e-tron", transmission: "LUXURY_EV" },
    ],
  },
  {
    brand: "Jaguar",
    models: [
      { name: "XF", transmission: "AUTOMATIC" },
      { name: "I-PACE", transmission: "LUXURY_EV" },
    ],
  },
  {
    brand: "Tata",
    models: [
      { name: "Nexon EV", transmission: "LUXURY_EV" },
      { name: "Harrier", transmission: "MANUAL" },
      { name: "Safari", transmission: "AUTOMATIC" },
    ],
  },
];

export const DEMO_SAARTHI_DRIVER_ID =
  "aa111111-1111-1111-1111-111111111111";
