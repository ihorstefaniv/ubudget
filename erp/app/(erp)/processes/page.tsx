"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card, CardHeader, Input, Textarea, Button, Badge, Modal,
  EmptyState, Spinner, InfoBox, Icon, icons,
} from "@/components/ui";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step { id: string; name: string; duration_min: string; equipment: string; note: string }

interface Process {
  id: string; name: string; description: string | null; steps: Step[]; created_at: string;
}

interface BomUsage { id: string; name: string; process_id: string | null }

// ─── Constants ────────────────────────────────────────────────────────────────

const PROC_INIT = { name: "", description: "" };

function newStep(): Step {
  return { id: crypto.randomUUID(), name: "", duration_min: "", equipment: "", note: "" };
}

function totalDuration(steps: Step[]) {
  return steps.reduce((acc, s) => acc + (parseFloat(s.duration_min) || 0), 0);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProcessesPage() {
  const [loading,   setLoading]   = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [boms,       setBoms]     = useState<BomUsage[]>([]);

  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(PROC_INIT);
  const [steps,   setSteps]   = useState<Step[]>([newStep()]);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [saving,  setSaving]  = useState(false);

  const supabase = createClient();

  const loadAll = useCallback(async (cid: string) => {
    const [{ data: pr }, { data: bm }] = await Promise.all([
      supabase.from("erp_processes").select("id, name, description, steps, created_at").eq("company_id", cid).order("created_at", { ascending: false }),
      supabase.from("erp_bom").select("id, name, process_id").eq("company_id", cid),
    ]);
    setProcesses((pr as unknown as Process[]) ?? []);
    setBoms(bm ?? []);
    setLoading(false);
  }, []); // eslint-disable-line

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: c } = await supabase.from("erp_companies").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
      if (c) { setCompanyId(c.id); loadAll(c.id); }
      else setLoading(false);
    });
  }, []); // eslint-disable-line

  function openNew() {
    setForm(PROC_INIT);
    setSteps([newStep()]);
    setEditId(null);
    setModal(true);
  }

  function openEdit(p: Process) {
    setForm({ name: p.name, description: p.description ?? "" });
    setSteps(p.steps.length > 0 ? p.steps : [newStep()]);
    setEditId(p.id);
    setModal(true);
  }

  async function save() {
    if (!companyId || !form.name.trim()) return;
    setSaving(true);
    const cleanSteps = steps.filter(s => s.name.trim()).map(s => ({ ...s, name: s.name.trim() }));
    const payload = { company_id: companyId, name: form.name.trim(), description: form.description || null, steps: cleanSteps };
    if (editId) {
      await supabase.from("erp_processes").update(payload).eq("id", editId);
    } else {
      await supabase.from("erp_processes").insert(payload);
    }
    await loadAll(companyId);
    setSaving(false);
    setModal(false);
  }

  async function remove(id: string) {
    const used = boms.filter(b => b.process_id === id).length;
    if (used > 0) {
      if (!confirm(`Процес використовується у ${used} специфікаціях. Видалити? Зв'язок буде знято.`)) return;
    } else if (!confirm("Видалити процес?")) return;
    await supabase.from("erp_processes").delete().eq("id", id);
    setProcesses(p => p.filter(x => x.id !== id));
  }

  function updateStep(i: number, patch: Partial<Step>) {
    setSteps(p => p.map((s, j) => j === i ? { ...s, ...patch } : s));
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  if (!companyId) return (
    <Card><EmptyState emoji="🏢" title="Спочатку створіть компанію" desc="Налаштування → Компанія" /></Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Технологічні процеси</h1>
          <p className="text-sm text-neutral-500 mt-1">Опис і стандартизація виробничих процесів</p>
        </div>
        <Button icon={icons.plus} onClick={openNew}>Новий процес</Button>
      </div>

      <Card noPadding={processes.length > 0}>
        {processes.length === 0 ? (
          <>
            <CardHeader title="Процеси" action={<Button size="sm" icon={icons.plus} onClick={openNew}>Додати</Button>} />
            <EmptyState
              emoji="⚙️"
              title="Процесів ще немає"
              desc="Опишіть технологічні процеси для стандартизації виробництва і прив'язки до продуктів"
              action={<Button size="sm" onClick={openNew}>Додати перший процес</Button>}
            />
          </>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {processes.map(p => {
              const usedIn = boms.filter(b => b.process_id === p.id);
              return (
                <div key={p.id} className="px-5 py-4 group">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">{p.name}</p>
                        {p.steps.length > 0 && <Badge color="blue">{p.steps.length} кроків</Badge>}
                        {totalDuration(p.steps) > 0 && <Badge color="neutral">~{totalDuration(p.steps)} хв</Badge>}
                        {usedIn.length > 0 && <Badge color="green">{usedIn.length} специфікацій</Badge>}
                      </div>
                      {p.description && <p className="text-sm text-neutral-500 mt-1">{p.description}</p>}
                      {p.steps.length > 0 && (
                        <ol className="mt-2 space-y-1">
                          {p.steps.map((s, i) => (
                            <li key={s.id} className="text-xs text-neutral-500 flex items-baseline gap-2">
                              <span className="text-neutral-400 shrink-0">{i + 1}.</span>
                              <span className="text-neutral-700 dark:text-neutral-300">{s.name}</span>
                              {s.duration_min && <span className="text-neutral-400">· {s.duration_min} хв</span>}
                              {s.equipment && <span className="text-neutral-400">· {s.equipment}</span>}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400">
                        <Icon d={icons.edit} className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-300 hover:text-red-400">
                        <Icon d={icons.trash} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <InfoBox variant="blue">
        Технологічний процес — це послідовність операцій для виготовлення продукту.
        Кожен процес містить перелік кроків, норми часу та обладнання.
        Прив&apos;яжіть процес до специфікації (BOM) у розділі «Виробництво».
      </InfoBox>

      {modal && (
        <Modal title={editId ? "Редагувати процес" : "Новий процес"} onClose={() => setModal(false)} size="lg">
          <div className="space-y-4">
            <Input label="Назва *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Формування і випал чашки" />
            <Textarea label="Опис" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Короткий опис процесу..." />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Кроки процесу</label>
                <Button size="sm" variant="secondary" icon={icons.plus} onClick={() => setSteps(p => [...p, newStep()])}>Крок</Button>
              </div>
              <div className="space-y-2">
                {steps.map((s, i) => (
                  <div key={s.id} className="flex gap-2 items-start p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/40">
                    <span className="text-xs text-neutral-400 mt-2.5 w-4 shrink-0">{i + 1}.</span>
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="col-span-2 sm:col-span-2">
                        <Input placeholder="Назва операції" value={s.name} onChange={e => updateStep(i, { name: e.target.value })} />
                      </div>
                      <Input placeholder="Хв" type="number" value={s.duration_min} onChange={e => updateStep(i, { duration_min: e.target.value })} />
                      <Input placeholder="Обладнання" value={s.equipment} onChange={e => updateStep(i, { equipment: e.target.value })} />
                    </div>
                    <button onClick={() => setSteps(p => p.filter((_, j) => j !== i))} className="p-2 mt-0.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-300 hover:text-red-400 shrink-0">
                      <Icon d={icons.close} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setModal(false)}>Скасувати</Button>
              <Button loading={saving} onClick={save} disabled={!form.name.trim()}>
                {editId ? "Зберегти" : "Додати"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
