// ФАЙЛ: app/(admin)/tickets/page.tsx
// URL: /admin/tickets — список тикетів підтримки + slide-out drawer

"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/auth";

interface Ticket {
  id: number; number: string; email: string; subject: string;
  message: string; status: "new" | "in_progress" | "closed";
  admin_reply: string | null; created_at: string; updated_at: string; user_id: string | null;
}

const Icon = ({ d, cls = "w-4 h-4" }: { d: string; cls?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={cls}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const ic = {
  close: "M6 18L18 6M6 6l12 12",
  send:  "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
};

const STATUS = {
  new:         { cls: "bg-blue-100 text-blue-700",       label: "Новий"    },
  in_progress: { cls: "bg-amber-100 text-amber-700",     label: "В роботі" },
  closed:      { cls: "bg-neutral-100 text-neutral-500", label: "Закрито"  },
};

const TABS = [
  { key: "all",         label: "Всі"      },
  { key: "new",         label: "Нові"     },
  { key: "in_progress", label: "В роботі" },
  { key: "closed",      label: "Закриті"  },
] as const;
type TabKey = typeof TABS[number]["key"];

// ─── Drawer ───────────────────────────────────────────────────
function TicketDrawer({ ticket, onClose, onUpdate }: {
  ticket: Ticket; onClose: () => void; onUpdate: (t: Ticket) => void;
}) {
  const [reply, setReply]   = useState(ticket.admin_reply ?? "");
  const [status, setStatus] = useState(ticket.status);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const supabase = createClient();
    const updates  = { admin_reply: reply, status, updated_at: new Date().toISOString() };
    await supabase.from("tickets").update(updates).eq("id", ticket.id);
    onUpdate({ ...ticket, ...updates });
    setSaving(false);
  }

  async function changeStatus(s: Ticket["status"]) {
    setStatus(s);
    const supabase = createClient();
    await supabase.from("tickets").update({ status: s, updated_at: new Date().toISOString() }).eq("id", ticket.id);
    onUpdate({ ...ticket, status: s });
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400">{ticket.number}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS[status].cls}`}>{STATUS[status].label}</span>
            </div>
            <h2 className="font-semibold text-neutral-900 mt-0.5 text-sm">{ticket.subject}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-neutral-100 text-neutral-400">
            <Icon d={ic.close} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="space-y-2 text-sm">
            {[["Email", ticket.email], ["Дата", new Date(ticket.created_at).toLocaleDateString("uk-UA", { day:"numeric", month:"long", year:"numeric", hour:"2-digit", minute:"2-digit" })]].map(([k,v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-neutral-400">{k}</span>
                <span className="text-neutral-900 font-medium">{v}</span>
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Повідомлення</p>
            <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-100 text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap">{ticket.message}</div>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Статус</p>
            <div className="flex gap-2">
              {(["new","in_progress","closed"] as const).map(s => (
                <button key={s} onClick={() => changeStatus(s)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${status === s ? STATUS[s].cls + " ring-2 ring-offset-1 ring-current" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"}`}>
                  {STATUS[s].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Відповідь адміна</p>
            <textarea value={reply} onChange={e => setReply(e.target.value)}
              placeholder="Напишіть відповідь..." rows={5}
              className="w-full px-3.5 py-3 rounded-xl border border-neutral-200 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-orange-400 transition-colors resize-none" />
          </div>
        </div>

        <div className="px-5 py-4 border-t border-neutral-100 shrink-0">
          <button onClick={save} disabled={saving}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 active:scale-95 transition-all disabled:opacity-50">
            <Icon d={ic.send} />
            {saving ? "Збереження..." : "Зберегти відповідь"}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────
export default function AdminTicketsPage() {
  const [tickets, setTickets]     = useState<Ticket[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<TabKey>("all");
  const [selected, setSelected]   = useState<Ticket | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase.from("tickets").select("*").order("created_at", { ascending: false });
    setTickets(data ?? []);
    setLoading(false);
  }

  const counts = { all: tickets.length, new: tickets.filter(t=>t.status==="new").length, in_progress: tickets.filter(t=>t.status==="in_progress").length, closed: tickets.filter(t=>t.status==="closed").length };
  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  return (
    <>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Тикети підтримки</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{counts.new} нових звернень</p>
        </div>

        <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl w-fit flex-wrap">
          {TABS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${filter===key ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-700"}`}>
              {label}
              <span className={`ml-1.5 text-xs ${filter===key ? "text-orange-500" : "text-neutral-400"}`}>{counts[key]}</span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-neutral-400"><p className="text-2xl mb-2">🎉</p><p className="text-sm">Нових звернень немає</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  {["#", "Тема", "Email", "Статус", "Дата"].map(h => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider ${["Email","Дата"].includes(h) ? "hidden sm:table-cell" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {filtered.map(t => (
                  <tr key={t.id} onClick={() => setSelected(t)} className="hover:bg-neutral-50 cursor-pointer transition-colors">
                    <td className="px-5 py-3.5"><span className="text-xs font-mono text-neutral-400">{t.number}</span></td>
                    <td className="px-5 py-3.5">
                      <p className="text-sm font-medium text-neutral-900">{t.subject}</p>
                      <p className="text-xs text-neutral-400 truncate max-w-[180px]">{t.message}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden sm:table-cell"><span className="text-xs text-neutral-500">{t.email}</span></td>
                    <td className="px-5 py-3.5"><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS[t.status].cls}`}>{STATUS[t.status].label}</span></td>
                    <td className="px-5 py-3.5 hidden sm:table-cell"><span className="text-xs text-neutral-400">{new Date(t.created_at).toLocaleDateString("uk-UA")}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selected && <TicketDrawer ticket={selected} onClose={() => setSelected(null)} onUpdate={t => { setTickets(ts => ts.map(tt => tt.id===t.id ? t : tt)); setSelected(t); }} />}
    </>
  );
}