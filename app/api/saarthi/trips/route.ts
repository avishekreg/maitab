import { NextResponse, type NextRequest } from "next/server";
import {
  acceptTrip,
  createTrip,
  getTrip,
  listTrips,
  patchTrip,
} from "@/lib/saarthi/store";
import type { TransmissionType } from "@/lib/saarthi/types";

export async function GET(request: NextRequest) {
  const guestPhone = request.nextUrl.searchParams.get("guestPhone") || undefined;
  const driverId = request.nextUrl.searchParams.get("driverId") || undefined;
  return NextResponse.json({
    ok: true,
    trips: listTrips({ guestPhone, driverId }),
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const guest_name = String(body.guest_name || "").trim();
  const guest_phone = String(body.guest_phone || "").trim();
  const car_brand = String(body.car_brand || "").trim();
  const car_model = String(body.car_model || "").trim();
  const transmission_type = String(body.transmission_type || "") as TransmissionType;
  const drop_address = String(body.drop_address || "").trim();
  const pickup_venue_name = String(body.pickup_venue_name || "").trim();

  if (!guest_name || !guest_phone || !car_brand || !car_model || !drop_address) {
    return NextResponse.json(
      { ok: false, error: "Guest, vehicle, and drop address are required" },
      { status: 400 }
    );
  }
  if (!["AUTOMATIC", "MANUAL", "LUXURY_EV"].includes(transmission_type)) {
    return NextResponse.json(
      { ok: false, error: "Invalid transmission type" },
      { status: 400 }
    );
  }

  const trip = createTrip({
    guest_id: body.guest_id ? String(body.guest_id) : null,
    guest_name,
    guest_phone,
    venue_id: body.venue_id ? String(body.venue_id) : undefined,
    car_brand,
    car_model,
    transmission_type,
    pickup_venue_name: pickup_venue_name || "Neon District",
    drop_address,
  });
  return NextResponse.json({ ok: true, trip });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id || "");
  const action = String(body.action || "");
  const trip = getTrip(id);
  if (!trip) {
    return NextResponse.json({ ok: false, error: "Trip not found" }, { status: 404 });
  }

  if (action === "accept") {
    const driverId = String(body.driver_id || "");
    const next = acceptTrip(id, driverId);
    return NextResponse.json({ ok: true, trip: next });
  }

  if (action === "arrive") {
    return NextResponse.json({
      ok: true,
      trip: patchTrip(id, { trip_status: "ARRIVED_AT_VALET" }),
    });
  }

  if (action === "start") {
    const otp = String(body.otp || "");
    if (otp !== trip.trip_otp) {
      return NextResponse.json(
        { ok: false, error: "OTP handshake failed" },
        { status: 403 }
      );
    }
    return NextResponse.json({
      ok: true,
      trip: patchTrip(id, {
        trip_status: "IN_PROGRESS",
        started_at: new Date().toISOString(),
      }),
    });
  }

  if (action === "complete") {
    return NextResponse.json({
      ok: true,
      trip: patchTrip(id, {
        trip_status: "COMPLETED",
        completed_at: new Date().toISOString(),
      }),
    });
  }

  if (action === "cancel") {
    return NextResponse.json({
      ok: true,
      trip: patchTrip(id, { trip_status: "CANCELLED" }),
    });
  }

  return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
}
