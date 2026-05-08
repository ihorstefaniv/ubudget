"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/auth";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskType     = "bug" | "feature" | "task" | "chore" | "idea";
type TaskStatus   = "backlog" | "todo" | "in_progress" | "review" | "done";
type TaskPriority = "low" | "medium" | "high" | "critical";

interface Task {
  id: string;
  title: string;
  description: string | null;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | null;
  due_date: string | null;
  estimated_hrs: number | null;
  logged_hrs: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUSES: { key: TaskStatus; label: string; color: string }[] = [
  { key: "backlog",     label: "Беклог",      color: "bg-neutral-500" },
  { key: "todo",        label: "До роботи",   color: "bg-blue-500"    },
  { key: "in_progress", label: "В роботі",    color: "bg-orange-500"  },
  { key: "review",      label: "Ревʼю",       color: "bg-purple-500"  },
  { key: "done",        label: "Готово",       color: "bg-green-500"   },
];

const TYPES: { key: TaskType; label: string; emoji: string }[] = [
  { key: "bug",     label: "Баг",      emoji: "🐛" },
  { key: "feature", label: "Фіча",     emoji: "✨" },
  { key: "task",    label: "Таск",     emoji: "📋" },
  { key: "chore",   label: "Рутина",   emoji: "🔧" },
  { key: "idea",    label: "Ідея",     emoji: "💡" },
];

const PRIORITIES: { key: TaskPriority; label: string; color: string }[] = [
  { key: "low",      label: "Низький",    color: "text-neutral-400" },
  { key: "medium",   label: "Середній",   color: "text-blue-400"    },
  { key: "high",     label: "Високий",    color: "text-orange-400"  },
  { key: "critical", label: "Критичний",  color: "text-red-400"     },
];

const ASSIGNEES = ["Ігор", "Друг", "Claude"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeEmoji(type: TaskType) {
  return TYPES.find(t => t.key === type)?.emoji ?? "📋";
}

function priorityColor(priority: TaskPriority) {
  return PRIORITIES.find(p => p.key === priority)?.color ?? "text-neutral-400";
}

function priorityLabel(priority: TaskPriority) {
  return PRIORITIES.find(p => p.key === priority)?.label ?? priority;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function isOverdue(due_date: string | null) {
  if (!due_date) return false;
  return new Date(due_date) < new Date(new Date().toDateString());
}

// ─── Task Modal ───────────────────────────────────────────────────────────────

const EMPTY: Omit<Task, "id" | "created_at" | "updated_at" | "logged_hrs"> = {
  title: "",
  description: null,
  type: "task",
  status: "backlog",
  priority: "medium",
  assignee: null,
  due_date: null,
  estimated_hrs: null,
  created_by: null,
};

function TaskModal({ task, onSave, onDelete, onClose }: {
  task: Task | null;
  onSave: (data: Partial<Task>) => Promise<void>;
  onDelete?: () => Promise<void>;
  onClose: () => void;
}) {
  const isNew = !task;
  const [form, setForm] = useState<typeof EMPTY>(task ? {
    title: task.title,
    description: task.description,
    type: task.type,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee,
    due_date: task.due_date,
    estimated_hrs: task.estimated_hrs,
    created_by: task.created_by,
  } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function set(key: keyof typeof EMPTY, value: unknown) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  async function handleDelete() {
    if (!onDelete || !confirm("Видалити задачу?")) return;
    setDeleting(true);
    await onDelete();
    setDeleting(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-neutral-900">{isNew ? "Нова задача" : "Редагування"}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 text-xl leading-none">×</button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Назва *</label>
            <input
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="Що треба зробити?"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Опис</label>
            <textarea
              value={form.description ?? ""}
              onChange={e => set("description", e.target.value || null)}
              rows={3}
              placeholder="Деталі, контекст, кроки..."
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400 resize-none"
            />
          </div>

          {/* Type + Priority row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Тип</label>
              <select
                value={form.type}
                onChange={e => set("type", e.target.value as TaskType)}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              >
                {TYPES.map(t => (
                  <option key={t.key} value={t.key}>{t.emoji} {t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Пріоритет</label>
              <select
                value={form.priority}
                onChange={e => set("priority", e.target.value as TaskPriority)}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              >
                {PRIORITIES.map(p => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">Статус</label>
            <select
              value={form.status}
              onChange={e => set("status", e.target.value as TaskStatus)}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            >
              {STATUSES.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Assignee + Due date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Виконавець</label>
              <select
                value={form.assignee ?? ""}
                onChange={e => set("assignee", e.target.value || null)}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              >
                <option value="">— не призначено —</option>
                {ASSIGNEES.map(a => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Дедлайн</label>
              <input
                type="date"
                value={form.due_date ?? ""}
                onChange={e => set("due_date", e.target.value || null)}
                className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
              />
            </div>
          </div>

          {/* Estimated hrs (placeholder for time tracking) */}
          <div>
            <label className="block text-xs font-medium text-neutral-500 mb-1">
              Оцінка (год) <span className="text-neutral-300">— тайм трекінг буде пізніше</span>
            </label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.estimated_hrs ?? ""}
              onChange={e => set("estimated_hrs", e.target.value ? parseFloat(e.target.value) : null)}
              placeholder="0"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100">
          <div>
            {!isNew && onDelete && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-sm text-red-400 hover:text-red-600 transition-colors"
              >
                {deleting ? "Видалення..." : "Видалити"}
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
              Скасувати
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.title.trim()}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-xl hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {saving ? "Збереження..." : isNew ? "Створити" : "Зберегти"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({ task, onOpen, onStatusChange }: {
  task: Task;
  onOpen: (t: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  const overdue = isOverdue(task.due_date) && task.status !== "done";

  return (
    <div
      className="bg-white rounded-xl p-3 shadow-sm border border-neutral-100 hover:border-orange-200 transition-colors cursor-pointer group"
      onClick={() => onOpen(task)}
    >
      {/* Type + priority */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-base">{typeEmoji(task.type)}</span>
        <span className={`text-xs font-medium ${priorityColor(task.priority)}`}>
          {priorityLabel(task.priority)}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-medium text-neutral-800 leading-snug mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Meta */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {task.assignee && (
            <span className="text-xs bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded-md">
              {task.assignee}
            </span>
          )}
          {task.due_date && (
            <span className={`text-xs px-1.5 py-0.5 rounded-md ${
              overdue ? "bg-red-50 text-red-500" : "bg-neutral-100 text-neutral-500"
            }`}>
              {formatDate(task.due_date)}
            </span>
          )}
        </div>
        {/* Quick status change — stop propagation so card click doesn't open modal */}
        <select
          value={task.status}
          onClick={e => e.stopPropagation()}
          onChange={e => { e.stopPropagation(); onStatusChange(task.id, e.target.value as TaskStatus); }}
          className="text-xs border-0 bg-transparent text-neutral-400 focus:outline-none cursor-pointer hover:text-neutral-600 -mr-1"
        >
          {STATUSES.map(s => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────

function KanbanColumn({ status, tasks, onOpen, onStatusChange }: {
  status: typeof STATUSES[number];
  tasks: Task[];
  onOpen: (t: Task) => void;
  onStatusChange: (id: string, status: TaskStatus) => void;
}) {
  return (
    <div className="flex flex-col min-w-[240px] w-[240px] bg-neutral-50 rounded-2xl p-3">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2 h-2 rounded-full ${status.color}`} />
        <span className="text-sm font-semibold text-neutral-700">{status.label}</span>
        <span className="ml-auto text-xs text-neutral-400 bg-white rounded-full px-2 py-0.5 border border-neutral-200">
          {tasks.length}
        </span>
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 flex-1">
        {tasks.map(t => (
          <TaskCard key={t.id} task={t} onOpen={onOpen} onStatusChange={onStatusChange} />
        ))}
        {tasks.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-4">Порожньо</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks]             = useState<Task[]>([]);
  const [loading, setLoading]         = useState(true);
  const [modal, setModal]             = useState<Task | null | "new">(null);
  const [filterType, setFilterType]   = useState<TaskType | "">("");
  const [filterPrio, setFilterPrio]   = useState<TaskPriority | "">("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterDone, setFilterDone]   = useState(false);

  const supabase = createClient();

  const load = useCallback(async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    setTasks(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(data: Partial<Task>) {
    if (modal === "new") {
      await supabase.from("tasks").insert([data]);
    } else if (modal) {
      await supabase.from("tasks").update(data).eq("id", modal.id);
    }
    setModal(null);
    load();
  }

  async function handleDelete() {
    if (!modal || modal === "new") return;
    await supabase.from("tasks").delete().eq("id", modal.id);
    setModal(null);
    load();
  }

  async function handleStatusChange(id: string, status: TaskStatus) {
    await supabase.from("tasks").update({ status }).eq("id", id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t));
  }

  // Filter
  const visible = tasks.filter(t => {
    if (!filterDone && t.status === "done") return false;
    if (filterType && t.type !== filterType) return false;
    if (filterPrio && t.priority !== filterPrio) return false;
    if (filterAssignee && t.assignee !== filterAssignee) return false;
    return true;
  });

  const byStatus = (status: TaskStatus) => visible.filter(t => t.status === status);

  // Stats
  const total   = tasks.length;
  const inWork  = tasks.filter(t => t.status === "in_progress").length;
  const done    = tasks.filter(t => t.status === "done").length;
  const bugs    = tasks.filter(t => t.type === "bug" && t.status !== "done").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Завдання</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Внутрішній таск-менеджер UBudget</p>
        </div>
        <button
          onClick={() => setModal("new")}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <span className="text-base leading-none">+</span>
          Нова задача
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Всього",      value: total,  color: "text-neutral-900" },
          { label: "В роботі",   value: inWork,  color: "text-orange-600"  },
          { label: "Готово",      value: done,    color: "text-green-600"   },
          { label: "Відкриті баги", value: bugs,  color: "text-red-500"     },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl px-4 py-3 border border-neutral-100">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-neutral-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-xl px-4 py-3 border border-neutral-100">
        <span className="text-xs font-medium text-neutral-500">Фільтр:</span>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as TaskType | "")}
          className="text-sm border border-neutral-200 rounded-lg px-2 py-1 focus:outline-none"
        >
          <option value="">Всі типи</option>
          {TYPES.map(t => <option key={t.key} value={t.key}>{t.emoji} {t.label}</option>)}
        </select>

        <select
          value={filterPrio}
          onChange={e => setFilterPrio(e.target.value as TaskPriority | "")}
          className="text-sm border border-neutral-200 rounded-lg px-2 py-1 focus:outline-none"
        >
          <option value="">Всі пріоритети</option>
          {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
        </select>

        <select
          value={filterAssignee}
          onChange={e => setFilterAssignee(e.target.value)}
          className="text-sm border border-neutral-200 rounded-lg px-2 py-1 focus:outline-none"
        >
          <option value="">Всі виконавці</option>
          {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
        </select>

        <label className="flex items-center gap-1.5 text-sm text-neutral-500 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={filterDone}
            onChange={e => setFilterDone(e.target.checked)}
            className="rounded"
          />
          Показати готові
        </label>
      </div>

      {/* Kanban board */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.filter(s => filterDone || s.key !== "done").map(s => (
            <KanbanColumn
              key={s.key}
              status={s}
              tasks={byStatus(s.key)}
              onOpen={setModal}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal !== null && (
        <TaskModal
          task={modal === "new" ? null : modal}
          onSave={handleSave}
          onDelete={modal !== "new" ? handleDelete : undefined}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
