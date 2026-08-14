import { NextResponse, type NextRequest } from "next/server";
import { getDriver, listDrivers, setDriverOnline } from "@/lib/saarthi/store";

export async function GET() {
  return NextResponse.json({ ok: true, drivers: listDrivers() });
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json()) as { id?: string; is_online?: boolean };
  if (!body.id) {
    return NextResponse.json({ ok: false, error: "Driver id required" }, { status: 400 });
  }
  const driver = setDriverOnline(body.id, body.is_online !== false);
  if (!driver) {
    return NextResponse.json({ ok: false, error: "Driver not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, driver: getDriver(body.id) });
}
