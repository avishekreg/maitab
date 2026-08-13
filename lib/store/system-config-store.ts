"use client";

import { create } from "zustand";
import {
  DEFAULT_SYSTEM_CONFIGS,
  type SystemConfigItem,
} from "@/lib/admin/system-config";

interface SystemConfigState {
  configs: SystemConfigItem[];
  hydrate: (items: SystemConfigItem[]) => void;
  upsertLocal: (item: SystemConfigItem) => void;
  setFlag: (key: string, enabled: boolean) => void;
  setRadius: (meters: number) => void;
  getFlag: (key: string) => boolean;
  getRadius: () => number;
}

export const useSystemConfigStore = create<SystemConfigState>((set, get) => ({
  configs: DEFAULT_SYSTEM_CONFIGS,

  hydrate: (items) => set({ configs: items }),

  upsertLocal: (item) =>
    set((state) => ({
      configs: state.configs.map((cfg) =>
        cfg.config_key === item.config_key
          ? { ...item, updated_at: new Date().toISOString() }
          : cfg
      ),
    })),

  setFlag: (key, enabled) =>
    set((state) => ({
      configs: state.configs.map((cfg) =>
        cfg.config_key === key
          ? {
              ...cfg,
              value_json: { ...cfg.value_json, enabled },
              updated_at: new Date().toISOString(),
            }
          : cfg
      ),
    })),

  setRadius: (meters) =>
    set((state) => ({
      configs: state.configs.map((cfg) =>
        cfg.config_key === "geo.lockout_radius_m"
          ? {
              ...cfg,
              value_json: { radius_m: meters },
              updated_at: new Date().toISOString(),
            }
          : cfg
      ),
    })),

  getFlag: (key) => {
    const item = get().configs.find((cfg) => cfg.config_key === key);
    return Boolean(item?.value_json?.enabled ?? true);
  },

  getRadius: () => {
    const item = get().configs.find(
      (cfg) => cfg.config_key === "geo.lockout_radius_m"
    );
    return Number(item?.value_json?.radius_m ?? 1500);
  },
}));
