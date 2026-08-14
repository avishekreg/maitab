"use client";

import { AppShell } from "@/components/layout/AppShell";
import { ResponsibleBadges } from "@/components/branding/responsible-badges";
import { MENU_ITEMS } from "@/lib/demo/data";
import { formatINR } from "@/lib/utils";

export default function DigitalDrinkMenuPage() {
  const groups = Array.from(
    MENU_ITEMS.reduce((map, item) => {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
      return map;
    }, new Map<string, (typeof MENU_ITEMS)[number][]>())
  );

  return (
    <AppShell title="Menu" showComplianceStrip={false}>
      <h1 className="font-display text-3xl font-bold">Digital drink menu</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Venue catalog for the active session — same unique list as Tab.
      </p>
      <div className="mt-8 space-y-8">
        {groups.map(([category, items]) => (
          <section key={category}>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              {category}
            </p>
            <ul className="divide-y divide-white/10 rounded-2xl border border-white/10">
              {items.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="font-medium text-foreground">{item.name}</span>
                  <span className="tabular-nums text-accent-gold">
                    {formatINR(item.unit_price)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="mt-10 flex justify-center pb-4">
        <ResponsibleBadges density="strip" />
      </div>
    </AppShell>
  );
}
