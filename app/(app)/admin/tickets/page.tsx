"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────
type TicketStatus = "new" | "assigned" | "in_progress" | "done" | "cancelled" | "hold";

interface Ticket {
  id: number;
  number: string;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  source_url: string | null;
  screenshot_url: string | null;
  assignee_id: string | null;
  admin_reply: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

// ─── Constants ────────────────────────────────────────────────
const STATUS: Record<TicketStatus, { cls: string; dot: string; label: string }> = {
  new:         { cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",         dot: "bg-blue-400",     label: "Нова"       },
  assigned:    { cls: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400", dot: "bg-purple-400",   label: "Призначено" },
  in_progress: { cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",     dot: "bg-amber-400",   label: "В роботі"   },
  done:        { cls: "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400",      dot: "bg-green-500",   label: "Завершено"  },
  cancelled:   { cls: "bg-red-100 text-red-600 dark:bg-red-950/40 dark:text-red-400",             dot: "bg-red-400",     label: "Скасовано"  },
  hold:        { cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400", dot: "bg-neutral-400", label: "Холд"       },
};

const ALL_STATUSES: TicketStatus[] = ["new","assigned","in_progress","done","cancelled","hold"];

const TABS = [
  { key: "all",         label: "Всі"        },
  { key: "new",         label: "Нові"       },
  { key: "assigned",    label: "Призначено" },
  { key: "in_progress", label: "В роботі"  },
  { key: "done",        label: "Завершено"  },
  { key: "hold",        label: "Холд"       },
] as const;
type TabKey = typeof TABS[number]["key"];

// ─── Icons ────────────────────────────────────────────────────
const Ico = ({ d, cls = "w-4 h-4" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ic = {
  close:  "M6 18L18 6M6 6l12 12",
  send:   "M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5",
  link:   "M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1",
  image:  "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
  expand: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15",
};

// ─── Drawer ───────────────────────────────────────────────────
function TicketDrawer({ ticket, onClose, onUpdate }: {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: (t: Ticket) => void;
}) {
  const [reply, setReply]     = useState(ticket.admin_reply ?? "");
  const [status, setStatus]   = useState<TicketStatus>(ticket.status);
  const [saving, setSaving]   = useState(false);
  const [imgFull, setImgFull] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const updates  = { admin_reply: reply, status, updated_at: new Date().toISOString() };
    await supabase.from("tickets").update(updates).eq("id", ticket.id);
    onUpdate({ ...ticket, ...updates });
    setSaving(false);
  }

  async function changeStatus(s: TicketStatus) {
    setStatus(s);
    const supabase = createClient();
    await supabase.from("tickets").update({ status: s, updated_at: new Date().toISOString() }).eq("id", ticket.id);
    onUpdate({ ...ticket, status: s });
  }

  const st = STATUS[status];

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-neutral-900 z-50 shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono text-neutral-400">{ticket.number}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${st.cls}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>
            <h2 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm leading-snug">{ticket.subject}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400">
            <Ico d={ic.close} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Мета */}
          <div className="space-y-1.5 text-sm">
            {[
              ["Email",   ticket.email],
              ["Дата",    new Date(ticket.created_at).toLocaleDateString("uk-UA", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-neutral-400 shrink-0">{k}</span>
                <span className="text-neutral-900 dark:text-neutral-100 font-medium text-right">{v}</span>
              </div>
            ))}
            {ticket.source_url && (
              <div className="flex justify-between gap-4">
                <span className="text-neutral-400 shrink-0">Сторінка</span>
                <span className="text-neutral-500 dark:text-neutral-400 text-xs text-right truncate max-w-[220px] flex items-center gap-1">
                  <Ico d={ic.link} cls="w-3 h-3 shrink-0" />
                  {ticket.source_url}
                </span>
              </div>
            )}
          </div>

          {/* Опис */}
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Опис проблеми</p>
            <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
              {ticket.message}
            </div>
          </div>

          {/* Скріншот */}
          {ticket.screenshot_url && (
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Ico d={ic.image} cls="w-3.5 h-3.5" />
                Скріншот
              </p>
              <div className="relative rounded-xl overflow-hidden border border-neutral-100 dark:border-neutral-700 cursor-zoom-in" onClick={() => setImgFull(true)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ticket.screenshot_url} alt="screenshot" className="w-full max-h-48 object-cover hover:opacity-90 transition-opacity" />
                <div className="absolute bottom-2 right-2 bg-black/50 text-white rounded-lg px-2 py-1 text-xs flex items-center gap-1">
                  <Ico d={ic.expand} cls="w-3 h-3" />
                  Повний розмір
                </div>
              </div>
            </div>
          )}

          {/* Статус */}
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Статус</p>
            <div className="grid grid-cols-3 gap-1.5">
              {ALL_STATUSES.map(s => (
                <button key={s} onClick={() => changeStatus(s)}
                  className={`py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    status === s
                      ? STATUS[s].cls + " ring-2 ring-offset-1 ring-current"
                      : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                  }`}>
                  {STATUS[s].label}
                </button>
              ))}
            </div>
          </div>

          {/* Відповідь */}
          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Відповідь адміна</p>
            <textarea value={reply} onChange={e => setReply(e.target.value)}
              placeholder="Напишіть відповідь або нотатку..." rows={4}
              className="w-full px-3.5 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-none focus:border-orange-400 transition-colors resize-none" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
          <button onClick={save} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50">
            <Ico d={ic.send} />
            {saving ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      </div>

      {/* Повноекранний перегляд скріну */}
      {imgFull && ticket.screenshot_url && (
        <>
          <div className="fixed inset-0 bg-black/80 z-[60]" onClick={() => setImgFull(false)} />
          <div className="fixed inset-4 z-[61] flex items-center justify-center" onClick={() => setImgFull(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ticket.screenshot_url} alt="screenshot full" className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
          </div>
        </>
      )}
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function AdminTicketsPage() {
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState<TabKey>("all");
  const [selected, setSelected] = useState<Ticket | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }

  const counts = {
    all:         tickets.length,
    new:         tickets.filter(t => t.status === "new").length,
    assigned:    tickets.filter(t => t.status === "assigned").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    done:        tickets.filter(t => t.status === "done").length,
    hold:        tickets.filter(t => t.status === "hold").length,
  };

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  return (
    <>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">Тикети</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {counts.new > 0 ? `${counts.new} нових звернень` : "Нових звернень немає"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit flex-wrap">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === key
                  ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              }`}>
              {label}
              {counts[key] > 0 && (
                <span className={`ml-1.5 text-xs ${filter === key ? "text-orange-500" : "text-neutral-400"}`}>
                  {counts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-neutral-400">
              <p className="text-2xl mb-2">🎉</p>
              <p className="text-sm">Тут поки порожньо</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100 dark:border-neutral-800">
                  {["#", "Тема", "Статус", "Дата"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 dark:divide-neutral-800">
                {filtered.map(t => {
                  const st = STATUS[t.status] ?? STATUS.new;
                  return (
                    <tr key={t.id} onClick={() => setSelected(t)}
                      className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="text-xs font-mono text-neutral-400">{t.number}</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-[220px]">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{t.subject}</p>
                        <p className="text-xs text-neutral-400 truncate mt-0.5">{t.message}</p>
                        {t.source_url && (
                          <p className="text-[10px] text-neutral-300 dark:text-neutral-600 truncate mt-0.5">{t.source_url}</p>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 w-fit ${st.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-xs text-neutral-400">
                          {new Date(t.created_at).toLocaleDateString("uk-UA")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && (
        <TicketDrawer
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdate={t => {
            setTickets(ts => ts.map(tt => tt.id === t.id ? t : tt));
            setSelected(t);
          }}
        />
      )}
    </>
  );
}
