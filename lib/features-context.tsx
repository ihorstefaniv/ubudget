"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { isAtLeastAdmin } from "@/lib/permissions";

export type FeatureKey =
  | "feature_blog"
  | "feature_investments"
  | "feature_envelopes"
  | "feature_household"
  | "feature_collections"
  | "feature_tools";

interface FeaturesCtx {
  flags: Record<FeatureKey, boolean>;
  isAdmin: boolean;
  loaded: boolean;
  /** Повертає true якщо фіча доступна юзеру (або він адмін) */
  can: (key: FeatureKey) => boolean;
}

const defaults: Record<FeatureKey, boolean> = {
  feature_blog:        true,
  feature_investments: true,
  feature_envelopes:   false,
  feature_household:   false,
  feature_collections: false,
  feature_tools:       true,
};

const FeaturesContext = createContext<FeaturesCtx>({
  flags: defaults, isAdmin: false, loaded: false, can: () => true,
});

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const [flags, setFlags]     = useState<Record<FeatureKey, boolean>>(defaults);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded]   = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoaded(true); return; }

      const [{ data: siteSettings }, { data: profile }] = await Promise.all([
        supabase.from("site_settings").select("key, value"),
        supabase.from("profiles").select("role").eq("id", user.id).single(),
      ]);

      if (siteSettings) {
        const map: Partial<Record<FeatureKey, boolean>> = {};
        for (const row of siteSettings) {
          if (row.key in defaults) {
            map[row.key as FeatureKey] = row.value === "true";
          }
        }
        setFlags(f => ({ ...f, ...map }));
      }

      setIsAdmin(isAtLeastAdmin(profile?.role));
      setLoaded(true);
    }
    load();
  }, []);

  const can = (key: FeatureKey) => isAdmin || flags[key];

  return (
    <FeaturesContext.Provider value={{ flags, isAdmin, loaded, can }}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  return useContext(FeaturesContext);
}
