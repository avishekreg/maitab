import { NextResponse } from "next/server";
import { buildTableScanPath, signTableToken } from "@/lib/qr/hmac";

export async function POST(request: Request) {
  if (!process.env.TABLE_QR_HMAC_SECRET) {
    return NextResponse.json(
      { error: "TABLE_QR_HMAC_SECRET is not configured" },
      { status: 500 }
    );
  }

  const body = (await request.json()) as {
    clubId?: string;
    tableId?: string;
    tableCode?: string;
  };

  if (!body.clubId || !body.tableId || !body.tableCode) {
    return NextResponse.json(
      { error: "clubId, tableId, and tableCode are required" },
      { status: 400 }
    );
  }

  const token = signTableToken({
    clubId: body.clubId,
    tableId: body.tableId,
    tableCode: body.tableCode,
  });

  return NextResponse.json({
    token,
    path: buildTableScanPath(token),
  });
}
