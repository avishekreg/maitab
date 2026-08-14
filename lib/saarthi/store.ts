import { NEON_CLUB_ID } from "@/lib/supabase/env";
import {
  DEMO_SAARTHI_DRIVER_ID,
  SAARTHI_BASE_FARE,
  type SaarthiDriver,
  type SaarthiTrip,
  type SaarthiTripStatus,
  type TransmissionType,
} from "@/lib/saarthi/types";

const DEMO_DRIVER_MEERA = "aa111111-1111-1111-1111-111111111112";
const DEMO_DRIVER_VIKRAM = "aa111111-1111-1111-1111-111111111113";
const DEMO_DRIVER_RHEA = "aa111111-1111-1111-1111-111111111114";

let drivers: SaarthiDriver[] = [
  {
    id: DEMO_SAARTHI_DRIVER_ID,
    full_name: "Arjun Khanna",
    phone: "+919811100001",
    email: "arjun.saarthi@maitab.demo",
    dl_number: "MH14 20220391221",
    dl_expiry: "2028-11-30",
    pcc_certificate_url: "/compliance/pcc-arjun.pdf",
    police_verification_status: "VERIFIED",
    transmission_specialties: ["AUTOMATIC", "LUXURY_EV"],
    is_online: true,
    current_lat: 19.0765,
    current_lng: 72.8778,
    rating: 4.98,
    total_trips_completed: 412,
  },
  {
    id: DEMO_DRIVER_MEERA,
    full_name: "Meera Solanki",
    phone: "+919811100002",
    email: "meera.saarthi@maitab.demo",
    dl_number: "MH01 20190445512",
    dl_expiry: "2027-06-18",
    pcc_certificate_url: "/compliance/pcc-meera.pdf",
    police_verification_status: "VERIFIED",
    transmission_specialties: ["MANUAL", "AUTOMATIC"],
    is_online: true,
    current_lat: 19.0748,
    current_lng: 72.8791,
    rating: 4.96,
    total_trips_completed: 288,
  },
  {
    id: DEMO_DRIVER_VIKRAM,
    full_name: "Vikram Dsouza",
    phone: "+919811100003",
    email: "vikram.saarthi@maitab.demo",
    dl_number: "GA07 20210118844",
    dl_expiry: "2029-01-12",
    pcc_certificate_url: "/compliance/pcc-vikram.pdf",
    police_verification_status: "VERIFIED",
    transmission_specialties: ["LUXURY_EV", "AUTOMATIC", "MANUAL"],
    is_online: true,
    current_lat: 19.0781,
    current_lng: 72.8762,
    rating: 4.99,
    total_trips_completed: 640,
  },
  {
    id: DEMO_DRIVER_RHEA,
    full_name: "Rhea Menon",
    phone: "+919811100004",
    email: "rhea.saarthi@maitab.demo",
    dl_number: "KA03 20200881220",
    dl_expiry: "2028-04-09",
    pcc_certificate_url: "/compliance/pcc-rhea.pdf",
    police_verification_status: "VERIFIED",
    transmission_specialties: ["AUTOMATIC", "LUXURY_EV"],
    is_online: true,
    current_lat: 19.0756,
    current_lng: 72.8784,
    rating: 4.97,
    total_trips_completed: 351,
  },
];

let trips: SaarthiTrip[] = [];

export function listDrivers() {
  return drivers;
}

export function getDriver(id: string) {
  return drivers.find((d) => d.id === id) ?? null;
}

export function setDriverOnline(id: string, isOnline: boolean) {
  drivers = drivers.map((d) =>
    d.id === id ? { ...d, is_online: isOnline } : d
  );
  return getDriver(id);
}

function fourDigitOtp() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function matchDriver(transmission: TransmissionType) {
  return (
    drivers.find(
      (d) =>
        d.is_online &&
        d.police_verification_status === "VERIFIED" &&
        d.transmission_specialties.includes(transmission)
    ) ?? null
  );
}

export function createTrip(input: {
  guest_id?: string | null;
  guest_name: string;
  guest_phone: string;
  venue_id?: string;
  car_brand: string;
  car_model: string;
  transmission_type: TransmissionType;
  pickup_venue_name: string;
  drop_address: string;
}): SaarthiTrip {
  const hour = new Date().getHours();
  const surge = hour >= 22 || hour < 3 ? 250 : 0;
  const driver = matchDriver(input.transmission_type);
  const trip: SaarthiTrip = {
    id: crypto.randomUUID(),
    guest_id: input.guest_id ?? null,
    guest_name: input.guest_name,
    guest_phone: input.guest_phone,
    venue_id: input.venue_id || NEON_CLUB_ID,
    car_brand: input.car_brand,
    car_model: input.car_model,
    transmission_type: input.transmission_type,
    pickup_venue_name: input.pickup_venue_name,
    drop_address: input.drop_address,
    base_fare: SAARTHI_BASE_FARE,
    surge_fare: surge,
    total_fare: SAARTHI_BASE_FARE + surge,
    trip_otp: fourDigitOtp(),
    assigned_driver_id: driver?.id ?? null,
    trip_status: driver ? "ACCEPTED" : "REQUESTED",
    pre_trip_inspection_photos: [],
    started_at: null,
    completed_at: null,
    created_at: new Date().toISOString(),
  };
  trips = [trip, ...trips];
  return trip;
}

export function listTrips(filter?: {
  guestPhone?: string;
  driverId?: string;
  status?: SaarthiTripStatus;
}) {
  return trips.filter((t) => {
    if (filter?.guestPhone && t.guest_phone !== filter.guestPhone) return false;
    if (filter?.driverId && t.assigned_driver_id !== filter.driverId) {
      return false;
    }
    if (filter?.status && t.trip_status !== filter.status) return false;
    return true;
  });
}

export function getTrip(id: string) {
  return trips.find((t) => t.id === id) ?? null;
}

export function patchTrip(
  id: string,
  patch: Partial<
    Pick<
      SaarthiTrip,
      | "trip_status"
      | "assigned_driver_id"
      | "started_at"
      | "completed_at"
      | "pre_trip_inspection_photos"
    >
  >
) {
  trips = trips.map((t) => (t.id === id ? { ...t, ...patch } : t));
  const next = getTrip(id);
  if (next?.trip_status === "COMPLETED" && next.assigned_driver_id) {
    drivers = drivers.map((d) =>
      d.id === next.assigned_driver_id
        ? { ...d, total_trips_completed: d.total_trips_completed + 1 }
        : d
    );
  }
  return next;
}

export function acceptTrip(tripId: string, driverId: string) {
  const trip = getTrip(tripId);
  if (!trip || trip.trip_status !== "REQUESTED") return null;
  return patchTrip(tripId, {
    assigned_driver_id: driverId,
    trip_status: "ACCEPTED",
  });
}
