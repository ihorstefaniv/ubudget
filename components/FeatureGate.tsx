"use client";

import { ReactNode } from "react";
import { useFeatures, type FeatureKey } from "@/lib/features-context";

interface Props {
  featureKey: FeatureKey;
  label?: string;      // назва фічі для overlay (напр. "Інвестиції")
  children: ReactNode;
}

export default function FeatureGate({ featureKey, label, children }: Props) {
  const { can, loaded } = useFeatures();

  if (!loaded) return null;

  if (can(featureKey)) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ minHeight: "60vh" }}>
      {/* Розмитий фоновий контент */}
      <div className="pointer-events-none select-none" style={{ filter: "blur(3px)", opacity: 0.4 }}>
        <div className="space-y-4 p-4">
          <div className="h-10 bg-neutral-200 dark:bg-neutral-700 rounded-2xl w-48" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-neutral-200 dark:bg-neutral-700 rounded-2xl" />
            ))}
          </div>
          <div className="h-40 bg-neutral-200 dark:bg-neutral-700 rounded-2xl" />
          <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded-2xl" />
          <div className="h-28 bg-neutral-200 dark:bg-neutral-700 rounded-2xl" />
        </div>
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl"
        style={{ backdropFilter: "blur(6px)", backgroundColor: "rgba(255,255,255,0.6)" }}
      >
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/30 flex items-center justify-center mx-auto text-3xl">
            🔧
          </div>
          <div>
            <p className="font-bold text-neutral-900 dark:text-neutral-100 text-lg">
              {label ? `${label} — у розробці` : "У розробці"}
            </p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Цей розділ зараз тестується і буде доступний у наступних версіях UBudget.
            </p>
          </div>
          <div className="px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
            <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
              ✉️ Очікуйте оновлення — ми повідомимо коли буде готово
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
