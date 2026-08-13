import type { Order, OrderItem, OrderStatus } from "@/lib/types";
import { formatTokenDisplay, generateOrderTokenCode } from "@/lib/kds/token";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { isSupabaseConfigured, NEON_CLUB_ID } from "@/lib/supabase/env";
import { publishBus } from "@/lib/realtime/bus";
import { resolveBarCounterForTableId } from "@/lib/kds/routing";
import { resolveWaiterForTableId } from "@/lib/waiter/allocation";

function mapOrder(row: Record<string, unknown>): Order {
  return {
    id: String(row.id),
    session_id: String(row.session_id),
    club_id: String(row.club_id),
    items: (row.items as OrderItem[]) ?? [],
    total_amount: Number(row.total_amount ?? 0),
    status: row.status as OrderStatus,
    token_number: Number(row.token_number),
    created_at: String(row.created_at),
    ready_at: row.ready_at ? String(row.ready_at) : null,
    assigned_waiter_id: row.assigned_waiter_id
      ? String(row.assigned_waiter_id)
      : null,
    assigned_waiter_name: row.assigned_waiter_name
      ? String(row.assigned_waiter_name)
      : null,
    pickup_token_code: row.pickup_token_code
      ? String(row.pickup_token_code)
      : null,
    assigned_counter_id: row.assigned_counter_id
      ? String(row.assigned_counter_id)
      : null,
    assigned_counter_name: row.assigned_counter_name
      ? String(row.assigned_counter_name)
      : null,
  };
}

export async function fetchClubOrders(clubId = NEON_CLUB_ID): Promise<Order[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getBrowserSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("club_id", clubId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("fetchClubOrders", error.message);
    return null;
  }
  return (data ?? []).map((row) => mapOrder(row as Record<string, unknown>));
}

export async function createOrderLive(input: {
  sessionId: string;
  clubId: string;
  items: OrderItem[];
  primaryTableId?: string | null;
}): Promise<Order | null> {
  const total = input.items.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0
  );

  if (!isSupabaseConfigured()) {
    const token_number = generateOrderTokenCode([]);
    const route = resolveWaiterForTableId(
      input.primaryTableId,
      token_number,
      input.clubId
    );
    const bar = resolveBarCounterForTableId(
      input.primaryTableId,
      input.clubId
    );
    const order: Order = {
      id: `o-${crypto.randomUUID()}`,
      session_id: input.sessionId,
      club_id: input.clubId,
      items: input.items,
      total_amount: total,
      status: "PENDING",
      token_number,
      created_at: new Date().toISOString(),
      ready_at: null,
      assigned_waiter_id: route?.assigned_waiter_id ?? null,
      assigned_waiter_name: route?.assigned_waiter_name ?? null,
      pickup_token_code: route?.pickup_token_code ?? formatTokenDisplay(token_number),
      assigned_counter_id: bar?.assigned_counter_id ?? null,
      assigned_counter_name: bar?.assigned_counter_name ?? null,
    };
    publishBus("orders", "INSERT", order);
    return order;
  }

  const supabase = getBrowserSupabase();
  if (!supabase) return null;

  // DB trigger routes waiter + pickup_token_code; client may prefill for UX
  const previewToken = generateOrderTokenCode([]);
  const route = resolveWaiterForTableId(
    input.primaryTableId,
    previewToken,
    input.clubId
  );
  const bar = resolveBarCounterForTableId(
    input.primaryTableId,
    input.clubId
  );

  const { data, error } = await supabase
    .from("orders")
    .insert({
      session_id: input.sessionId,
      club_id: input.clubId,
      items: input.items,
      total_amount: total,
      status: "PENDING",
      assigned_waiter_id: route?.assigned_waiter_id ?? null,
      assigned_waiter_name: route?.assigned_waiter_name ?? null,
      pickup_token_code: route?.pickup_token_code ?? null,
      assigned_counter_id: bar?.assigned_counter_id ?? null,
      assigned_counter_name: bar?.assigned_counter_name ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("createOrderLive", error.message);
    return null;
  }

  const order = mapOrder(data as Record<string, unknown>);
  publishBus("orders", "INSERT", order);
  return order;
}

export async function markOrderReadyLive(orderId: string): Promise<Order | null> {
  const readyAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    const order = {
      id: orderId,
      status: "READY" as const,
      ready_at: readyAt,
    };
    publishBus("orders", "UPDATE", order);
    return null;
  }

  const supabase = getBrowserSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("orders")
    .update({ status: "READY", ready_at: readyAt })
    .eq("id", orderId)
    .select("*")
    .single();

  if (error) {
    console.error("markOrderReadyLive", error.message);
    return null;
  }

  const order = mapOrder(data as Record<string, unknown>);
  publishBus("orders", "UPDATE", order);
  return order;
}

export async function markOrderDeliveredLive(orderId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    publishBus("orders", "UPDATE", {
      id: orderId,
      status: "DELIVERED",
    });
    return true;
  }

  const supabase = getBrowserSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from("orders")
    .update({ status: "DELIVERED" })
    .eq("id", orderId);

  if (error) {
    console.error("markOrderDeliveredLive", error.message);
    return false;
  }

  publishBus("orders", "UPDATE", { id: orderId, status: "DELIVERED" });
  return true;
}
