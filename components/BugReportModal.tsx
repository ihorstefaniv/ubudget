"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { Icon, icons } from "@/components/ui";

interface Props {
  sourceUrl: string;   // pathname звідки викликали
  onClose: () => void;
}

export default function BugReportModal({ sourceUrl, onClose }: Props) {
  const supabase = createClient();
  const fileRef  = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState("");
  const [file, setFile]               = useState<File | null>(null);
  const [preview, setPreview]         = useState<string | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [done, setDone]               = useState(false);
  const [error, setError]             = useState("");

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  }

  function removeFile() {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit() {
    if (!description.trim()) { setError("Опишіть проблему"); return; }
    setError("");
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Не авторизований");

      // Знаходимо першого адміна для авто-призначення
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("id")
        .in("role", ["admin", "superadmin"])
        .order("created_at", { ascending: true })
        .limit(1)
        .single();

      // Завантажуємо скрін якщо є
      let screenshotUrl: string | null = null;
      if (file) {
        const ext  = file.name.split(".").pop() ?? "png";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("bug-screenshots")
          .upload(path, file, { upsert: false });
        if (!uploadErr) {
          const { data: pub } = supabase.storage
            .from("bug-screenshots")
            .getPublicUrl(path);
          screenshotUrl = pub.publicUrl;
        }
      }

      // Базові поля — завжди є в таблиці
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = {
        email:   user.email ?? "",
        subject: `Помилка на сторінці: ${sourceUrl}`,
        message: description.trim(),
        status:  "new",
        user_id: user.id,
      };
      // Додаємо нові поля лише якщо є значення (на випадок якщо міграція ще не запущена)
      if (sourceUrl)           payload.source_url     = sourceUrl;
      if (screenshotUrl)       payload.screenshot_url = screenshotUrl;
      if (adminProfile?.id)    payload.assignee_id    = adminProfile.id;

      const { error: insertErr } = await supabase.from("tickets").insert(payload);

      if (insertErr) {
        const msg = (insertErr as { message?: string }).message ?? JSON.stringify(insertErr);
        throw new Error(msg);
      }
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Помилка надсилання");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-base">
                🐛
              </div>
              <div>
                <p className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">Повідомити про помилку</p>
                <p className="text-xs text-neutral-400">Ми розглянемо якнайшвидше</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <Icon d={icons.close} className="w-4 h-4" />
            </button>
          </div>

          {done ? (
            /* Успіх */
            <div className="px-5 py-10 text-center space-y-3">
              <div className="text-4xl">✅</div>
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">Дякуємо!</p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Звіт надіслано. Ми розглянемо і виправимо якнайшвидше.
              </p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors"
              >
                Закрити
              </button>
            </div>
          ) : (
            /* Форма */
            <div className="px-5 py-4 space-y-4">
              {/* Опис */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Опис проблеми <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Що трапилось? Які кроки призвели до помилки?"
                  rows={4}
                  className="w-full px-3.5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-orange-400 transition-colors resize-none"
                />
              </div>

              {/* Скрін */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">
                  Скріншот <span className="text-neutral-300 dark:text-neutral-600 font-normal normal-case">(необов&apos;язково)</span>
                </label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
                {preview ? (
                  <div className="relative rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="preview" className="w-full max-h-40 object-cover" />
                    <button
                      onClick={removeFile}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                    >
                      <Icon d={icons.close} className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-neutral-400 hover:border-orange-300 hover:text-orange-400 dark:hover:border-orange-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Icon d={icons.plus} className="w-4 h-4" />
                    Прикріпити зображення
                  </button>
                )}
              </div>

              {/* Сторінка (авто) */}
              <div className="px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 text-neutral-400 shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{sourceUrl}</span>
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-1 pb-1">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Скасувати
                </button>
                <button
                  onClick={submit}
                  disabled={submitting || !description.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-orange-400 text-white text-sm font-semibold hover:bg-orange-500 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Надсилання..." : "Надіслати"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
