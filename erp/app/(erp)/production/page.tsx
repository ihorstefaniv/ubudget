"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card, Tabs, Input, Select, Textarea, Button, Badge, Modal,
  EmptyState, Spinner, StatCard, Icon, icons,
} from "@/components/ui";
import { fmt } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Unit { id: string; name: string; short_name: string }
interface Wh   { id: string; name: string }
interface ProcessLite { id: string; name: string }

interface Product {
  id: string; name: string; type: string; unit_id: string | null; cost_price: number | null;
  erp_units: { short_name: string } | null;
}

interface BomItemRow {
  id: string; material_id: string; qty: number; unit_id: string | null;
  erp_products: { name: string } | null;
  erp_units: { short_name: string } | null;
}

interface Bom {
  id: string; name: string; product_id: string; qty_output: number; process_id: string | null; created_at: string;
  erp_products: { name: string; erp_units: { short_name: string } | null } | null;
  erp_processes: { name: string } | null;
  erp_bom_items: BomItemRow[];
}

interface Order {
  id: string; number: string; product_id: string; bom_id: string | null; qty: number;
  status: string; warehouse_id: string | null; planned_date: string | null; completed_date: string | null; notes: string | null;
  created_at: string;
  erp_products: { name: string; erp_units: { short_name: string } | null } | null;
  erp_warehouses: { name: string } | null;
}

interface StockRow { product_id: string; warehouse_id: string; qty: number }

interface Movement {
  id: string; type: string; qty: number; price: number | null; created_at: string; reason: string | null; note: string | null;
  erp_products: { name: string; erp_units: { short_name: string } | null } | null;
}

interface BomItemForm { id: string; material_id: string; qty: string; unit_id: string }

// ─── Constants ────────────────────────────────────────────────────────────────

type PTab = "orders" | "bom" | "movements";

const TABS: { id: PTab; label: string }[] = [
  { id: "orders",    label: "Замовлення"        },
  { id: "bom",       label: "Специфікації"      },
  { id: "movements", label: "Рух виробництва"   },
];

const ORDER_STATUSES: Record<string, { label: string; color: "neutral" | "orange" | "green" | "red" }> = {
  planned:     { label: "Заплановано", color: "neutral" },
  in_progress: { label: "В роботі",    color: "orange"  },
  done:        { label: "Виконано",    color: "green"   },
  cancelled:   { label: "Скасовано",   color: "red"     },
};

const BOM_INIT = { name: "", product_id: "", qty_output: "1", process_id: "" };
const ORDER_INIT = { number: "", product_id: "", bom_id: "", qty: "", warehouse_id: "", planned_date: new Date().toISOString().split("T")[0], notes: "" };

function newBomItem(): BomItemForm {
  return { id: crypto.randomUUID(), material_id: "", qty: "", unit_id: "" };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function ProductionPage() {
  const [tab, setTab]         = useState<PTab>("orders");
  const [loading, setLoading] = useState(true);
  const [companyId, setCompanyId] = useState<string | null>(null);

  const [products,  setProducts]  = useState<Product[]>([]);
  const [units,      setUnits]    = useState<Unit[]>([]);
  const [warehouses, setWarehouses] = useState<Wh[]>([]);
  const [processes,  setProcesses] = useState<ProcessLite[]>([]);
  const [boms,       setBoms]      = useState<Bom[]>([]);
  const [orders,     setOrders]    = useState<Order[]>([]);
  const [stock,      setStock]     = useState<StockRow[]>([]);
  const [movements,  setMovements] = useState<Movement[]>([]);

  // BOM modal
  const [bomModal,  setBomModal]  = useState(false);
  const [bomForm,   setBomForm]   = useState(BOM_INIT);
  const [bomItems,  setBomItems]  = useState<BomItemForm[]>([newBomItem()]);
  const [editBomId, setEditBomId] = useState<string | null>(null);
  const [bomSaving, setBomSaving] = useState(false);

  // Order modal
  const [orderModal,  setOrderModal]  = useState(false);
  const [orderForm,   setOrderForm]   = useState(ORDER_INIT);
  const [orderSaving, setOrderSaving] = useState(false);
  const [completing,  setCompleting]  = useState<string | null>(null);

  const supabase = createClient();

  // ─── Loaders ──────────────────────────────────────────────────────────────

  const loadAll = useCallback(async (cid: string) => {
    const [{ data: pr }, { data: un }, { data: wh }, { data: pc }, { data: bm }, { data: ord }, { data: st }] = await Promise.all([
      supabase.from("erp_products").select("id, name, type, unit_id, cost_price, erp_units(short_name)").eq("company_id", cid).eq("is_archived", false).order("name"),
      supabase.from("erp_units").select("id, name, short_name").eq("company_id", cid).order("name"),
      supabase.from("erp_warehouses").select("id, name").eq("company_id", cid).eq("is_archived", false).order("name"),
      supabase.from("erp_processes").select("id, name").eq("company_id", cid).order("name"),
      supabase.from("erp_bom").select("id, name, product_id, qty_output, process_id, created_at, erp_products(name, erp_units(short_name)), erp_processes(name), erp_bom_items(id, material_id, qty, unit_id, erp_products(name), erp_units(short_name))").eq("company_id", cid).order("created_at", { ascending: false }),
      supabase.from("erp_production_orders").select("id, number, product_id, bom_id, qty, status, warehouse_id, planned_date, completed_date, notes, created_at, erp_products(name, erp_units(short_name)), erp_warehouses(name)").eq("company_id", cid).order("created_at", { ascending: false }),
      supabase.from("erp_stock").select("product_id, warehouse_id, qty").eq("company_id", cid),
    ]);
    setProducts((pr as unknown as Product[]) ?? []);
    setUnits(un ?? []);
    setWarehouses(wh ?? []);
    setProcesses(pc ?? []);
    setBoms((bm as unknown as Bom[]) ?? []);
    setOrders((ord as unknown as Order[]) ?? []);
    setStock(st ?? []);
    setLoading(false);
  }, []); // eslint-disable-line

  const loadMovements = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from("erp_stock_movements")
      .select("id, type, qty, price, created_at, reason, note, erp_products(name, erp_units(short_name))")
      .eq("company_id", cid)
      .not("production_order_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(150);
    setMovements((data as unknown as Movement[]) ?? []);
  }, []); // eslint-disable-line

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data: c } = await supabase.from("erp_companies").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
      if (c) { setCompanyId(c.id); loadAll(c.id); }
      else setLoading(false);
    });
  }, []); // eslint-disable-line

  useEffect(() => {
    if (tab === "movements" && companyId && movements.length === 0) loadMovements(companyId);
  }, [tab, companyId]); // eslint-disable-line

  // ─── Derived ──────────────────────────────────────────────────────────────

  const outputProducts = products.filter(p => p.type !== "service");
  const thisMonth = new Date().toISOString().slice(0, 7);
  const inProgressCount = orders.filter(o => o.status === "in_progress").length;
  const doneThisMonth = orders.filter(o => o.status === "done" && o.completed_date?.startsWith(thisMonth)).length;
  const materialCostMonth = movements
    .filter(m => m.type === "out" && m.created_at.startsWith(thisMonth))
    .reduce((acc, m) => acc + (m.price ?? 0) * m.qty, 0);

  const bomsForProduct = (productId: string) => boms.filter(b => b.product_id === productId);

  // ─── Save: BOM ────────────────────────────────────────────────────────────

  function openNewBom() {
    setBomForm(BOM_INIT);
    setBomItems([newBomItem()]);
    setEditBomId(null);
    setBomModal(true);
  }

  function openEditBom(b: Bom) {
    setBomForm({ name: b.name, product_id: b.product_id, qty_output: String(b.qty_output), process_id: b.process_id ?? "" });
    setBomItems(b.erp_bom_items.length > 0
      ? b.erp_bom_items.map(i => ({ id: i.id, material_id: i.material_id, qty: String(i.qty), unit_id: i.unit_id ?? "" }))
      : [newBomItem()]);
    setEditBomId(b.id);
    setBomModal(true);
  }

  async function saveBom() {
    if (!companyId || !bomForm.name.trim() || !bomForm.product_id) return;
    setBomSaving(true);
    const payload = {
      company_id: companyId, name: bomForm.name.trim(), product_id: bomForm.product_id,
      qty_output: parseFloat(bomForm.qty_output) || 1, process_id: bomForm.process_id || null,
    };
    let bomId = editBomId;
    if (editBomId) {
      await supabase.from("erp_bom").update(payload).eq("id", editBomId);
      await supabase.from("erp_bom_items").delete().eq("bom_id", editBomId);
    } else {
      const { data } = await supabase.from("erp_bom").insert(payload).select("id").single();
      bomId = data?.id ?? null;
    }
    const items = bomItems
      .filter(i => i.material_id && i.qty)
      .map(i => ({ bom_id: bomId, material_id: i.material_id, qty: parseFloat(i.qty), unit_id: i.unit_id || null }));
    if (bomId && items.length > 0) await supabase.from("erp_bom_items").insert(items);

    await loadAll(companyId);
    setBomSaving(false);
    setBomModal(false);
  }

  async function removeBom(id: string) {
    const used = orders.filter(o => o.bom_id === id && o.status !== "cancelled").length;
    if (used > 0 && !confirm(`Специфікація використана у ${used} замовленнях. Видалити?`)) return;
    if (used === 0 && !confirm("Видалити специфікацію?")) return;
    await supabase.from("erp_bom").delete().eq("id", id);
    setBoms(p => p.filter(x => x.id !== id));
  }

  function updateBomItem(i: number, patch: Partial<BomItemForm>) {
    setBomItems(p => p.map((it, j) => {
      if (j !== i) return it;
      const next = { ...it, ...patch };
      if (patch.material_id) {
        const mat = products.find(x => x.id === patch.material_id);
        if (mat?.unit_id) next.unit_id = mat.unit_id;
      }
      return next;
    }));
  }

  // ─── Save: Order ──────────────────────────────────────────────────────────

  function openNewOrder() {
    setOrderForm({ ...ORDER_INIT, number: `ВЗ-${String(orders.length + 1).padStart(3, "0")}`, warehouse_id: warehouses[0]?.id ?? "" });
    setOrderModal(true);
  }

  function selectOrderProduct(productId: string) {
    const matches = bomsForProduct(productId);
    setOrderForm(p => ({ ...p, product_id: productId, bom_id: matches.length === 1 ? matches[0].id : "" }));
  }

  async function saveOrder() {
    if (!companyId || !orderForm.number.trim() || !orderForm.product_id || !orderForm.qty || !orderForm.warehouse_id) return;
    setOrderSaving(true);
    await supabase.from("erp_production_orders").insert({
      company_id: companyId, number: orderForm.number.trim(), product_id: orderForm.product_id,
      bom_id: orderForm.bom_id || null, qty: parseFloat(orderForm.qty), warehouse_id: orderForm.warehouse_id,
      planned_date: orderForm.planned_date || null, notes: orderForm.notes || null,
    });
    await loadAll(companyId);
    setOrderSaving(false);
    setOrderModal(false);
  }

  async function setOrderStatus(o: Order, status: string) {
    if (!companyId) return;
    if (status === "cancelled" && !confirm(`Скасувати замовлення ${o.number}?`)) return;
    await supabase.from("erp_production_orders").update({ status }).eq("id", o.id);
    await loadAll(companyId);
  }

  async function completeOrder(o: Order) {
    if (!companyId || !o.warehouse_id) return;
    const bom = boms.find(b => b.id === o.bom_id);

    let materialCost = 0;
    const materialMoves: { company_id: string; product_id: string; warehouse_id: string; type: string; qty: number; price: number | null; currency: string; reason: string; note: string; production_order_id: string }[] = [];

    if (bom) {
      const ratio = o.qty / (bom.qty_output || 1);
      const shortages: string[] = [];
      for (const item of bom.erp_bom_items) {
        const need = item.qty * ratio;
        const available = stock.find(s => s.product_id === item.material_id && s.warehouse_id === o.warehouse_id)?.qty ?? 0;
        if (available < need) shortages.push(`${item.erp_products?.name ?? "?"}: потрібно ${need.toFixed(2)}, є ${available.toFixed(2)}`);
        const mat = products.find(p => p.id === item.material_id);
        const price = mat?.cost_price ?? null;
        if (price) materialCost += price * need;
        materialMoves.push({
          company_id: companyId, product_id: item.material_id, warehouse_id: o.warehouse_id!, type: "out",
          qty: need, price, currency: "UAH", reason: "Виробництво", note: `Замовлення ${o.number}`, production_order_id: o.id,
        });
      }
      if (shortages.length > 0 && !confirm(`Недостатньо матеріалів на складі:\n${shortages.join("\n")}\n\nЗавершити замовлення все одно?`)) return;
    }

    setCompleting(o.id);
    if (materialMoves.length > 0) await supabase.from("erp_stock_movements").insert(materialMoves);

    const unitCost = materialCost > 0 ? materialCost / o.qty : null;
    await supabase.from("erp_stock_movements").insert({
      company_id: companyId, product_id: o.product_id, warehouse_id: o.warehouse_id, type: "in",
      qty: o.qty, price: unitCost, currency: "UAH", reason: "Виробництво", note: `Замовлення ${o.number}`, production_order_id: o.id,
    });

    await supabase.from("erp_production_orders").update({ status: "done", completed_date: new Date().toISOString().split("T")[0] }).eq("id", o.id);

    await loadAll(companyId);
    if (tab === "movements") await loadMovements(companyId);
    setCompleting(null);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  if (!companyId) return (
    <Card><EmptyState emoji="🏢" title="Спочатку створіть компанію" desc="Налаштування → Компанія" /></Card>
  );

  const orderBoms = bomsForProduct(orderForm.product_id);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Виробництво</h1>
          <p className="text-sm text-neutral-500 mt-1">Замовлення, специфікації, списання матеріалів</p>
        </div>
        <Button icon={icons.plus} onClick={openNewOrder} disabled={warehouses.length === 0}>Нове замовлення</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Замовлень в роботі" value={String(inProgressCount)} color="orange" icon={icons.factory} />
        <StatCard label="Виконано (місяць)"  value={String(doneThisMonth)}  color="green"  emoji="✅" />
        <StatCard label="Специфікацій"       value={String(boms.length)}   color="blue"   icon={icons.doc} />
        <StatCard label="Собівартість (місяць)" value={fmt(materialCostMonth, "UAH", 0)} color="red" emoji="📉" />
      </div>

      <Tabs tabs={TABS} active={tab} onChange={t => setTab(t as PTab)} variant="underline" />

      {/* ══════════════════════════ ЗАМОВЛЕННЯ ═══════════════════════════════ */}
      {tab === "orders" && (
        <div className="space-y-4">
          {warehouses.length === 0 && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-sm text-amber-700 dark:text-amber-400">
              Спочатку додайте склад у розділі «Склад», щоб оформлювати замовлення
            </div>
          )}
          {orders.length === 0 ? (
            <Card><EmptyState emoji="🏭" title="Замовлень ще немає" desc="Створіть перше виробниче замовлення" action={<Button size="sm" onClick={openNewOrder} disabled={warehouses.length === 0}>Нове замовлення</Button>} /></Card>
          ) : (
            <Card noPadding>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {orders.map(o => {
                  const meta = ORDER_STATUSES[o.status] ?? { label: o.status, color: "neutral" as const };
                  return (
                    <div key={o.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{o.number}</p>
                          <Badge color={meta.color}>{meta.label}</Badge>
                        </div>
                        <p className="text-xs text-neutral-400 truncate">
                          {o.erp_products?.name ?? "—"} · {o.qty} {o.erp_products?.erp_units?.short_name ?? ""}
                          {o.erp_warehouses?.name && ` · ${o.erp_warehouses.name}`}
                          {o.planned_date && ` · ${new Date(o.planned_date).toLocaleDateString("uk-UA")}`}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        {o.status === "planned" && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => setOrderStatus(o, "in_progress")}>Почати</Button>
                            <Button size="sm" variant="ghost" onClick={() => setOrderStatus(o, "cancelled")}>Скасувати</Button>
                          </>
                        )}
                        {o.status === "in_progress" && (
                          <>
                            <Button size="sm" loading={completing === o.id} onClick={() => completeOrder(o)}>Завершити</Button>
                            <Button size="sm" variant="ghost" onClick={() => setOrderStatus(o, "cancelled")}>Скасувати</Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════ СПЕЦИФІКАЦІЇ ══════════════════════════════ */}
      {tab === "bom" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button icon={icons.plus} onClick={openNewBom}>Нова специфікація</Button>
          </div>
          {boms.length === 0 ? (
            <Card><EmptyState emoji="📐" title="Специфікацій ще немає" desc="Визначте склад матеріалів для кожного продукту" action={<Button size="sm" onClick={openNewBom}>Додати специфікацію</Button>} /></Card>
          ) : (
            <div className="space-y-3">
              {boms.map(b => (
                <Card key={b.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-neutral-800 dark:text-neutral-200">{b.name}</p>
                        <Badge color="blue">{b.erp_products?.name ?? "—"}</Badge>
                        {b.erp_processes?.name && <Badge color="purple">{b.erp_processes.name}</Badge>}
                      </div>
                      <p className="text-xs text-neutral-400 mt-1">
                        Вихід: {b.qty_output} {b.erp_products?.erp_units?.short_name ?? ""}
                      </p>
                      {b.erp_bom_items.length > 0 ? (
                        <ul className="mt-2 space-y-0.5">
                          {b.erp_bom_items.map(i => (
                            <li key={i.id} className="text-xs text-neutral-500">
                              {i.erp_products?.name ?? "?"} — {i.qty} {i.erp_units?.short_name ?? ""}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-xs text-neutral-400">Без матеріалів</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEditBom(b)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400">
                        <Icon d={icons.edit} className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => removeBom(b.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-300 hover:text-red-400">
                        <Icon d={icons.trash} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════ РУХ ВИРОБНИЦТВА ═══════════════════════════ */}
      {tab === "movements" && (
        <div className="space-y-4">
          {movements.length === 0 ? (
            <Card><EmptyState emoji="📋" title="Рухів ще немає" desc="Списання матеріалів і оприбуткування продукції з'являться тут після завершення замовлень" compact /></Card>
          ) : (
            <Card noPadding>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {movements.map(m => (
                  <div key={m.id} className="flex items-center gap-3 px-5 py-3">
                    <Badge color={m.type === "in" ? "green" : "red"}>{m.type === "in" ? "Випуск" : "Списання"}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{m.erp_products?.name ?? "—"}</p>
                      <p className="text-xs text-neutral-400 truncate">{m.note}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-sm font-semibold ${m.type === "in" ? "text-green-600" : "text-red-500"}`}>
                        {m.type === "in" ? "+" : "−"}{m.qty} {m.erp_products?.erp_units?.short_name ?? ""}
                      </p>
                      <p className="text-xs text-neutral-400">{new Date(m.created_at).toLocaleDateString("uk-UA")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════ MODAL: BOM ════════════════════════════════ */}
      {bomModal && (
        <Modal title={editBomId ? "Редагувати специфікацію" : "Нова специфікація"} onClose={() => setBomModal(false)} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input label="Назва *" value={bomForm.name} onChange={e => setBomForm(p => ({ ...p, name: e.target.value }))} placeholder="Специфікація чашки біла 330мл" />
              </div>
              <Select label="Продукт *" value={bomForm.product_id} onChange={e => setBomForm(p => ({ ...p, product_id: e.target.value }))}
                options={[{ value: "", label: "Оберіть продукт..." }, ...outputProducts.map(p => ({ value: p.id, label: p.name }))]}
              />
              <Input label="Вихід (кількість)" type="number" min="0.001" step="0.001" value={bomForm.qty_output} onChange={e => setBomForm(p => ({ ...p, qty_output: e.target.value }))} />
              <div className="col-span-2">
                <Select label="Технологічний процес" value={bomForm.process_id} onChange={e => setBomForm(p => ({ ...p, process_id: e.target.value }))}
                  options={[{ value: "", label: "Не вказано" }, ...processes.map(pc => ({ value: pc.id, label: pc.name }))]}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Матеріали</label>
                <Button size="sm" variant="secondary" icon={icons.plus} onClick={() => setBomItems(p => [...p, newBomItem()])}>Матеріал</Button>
              </div>
              <div className="space-y-2">
                {bomItems.map((it, i) => (
                  <div key={it.id} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <Select value={it.material_id} onChange={e => updateBomItem(i, { material_id: e.target.value })}
                        options={[{ value: "", label: "Матеріал..." }, ...products.filter(p => p.id !== bomForm.product_id).map(p => ({ value: p.id, label: p.name }))]}
                      />
                    </div>
                    <div className="w-28">
                      <Input placeholder="К-сть" type="number" min="0.001" step="0.001" value={it.qty} onChange={e => updateBomItem(i, { qty: e.target.value })} />
                    </div>
                    <div className="w-24">
                      <Select value={it.unit_id} onChange={e => updateBomItem(i, { unit_id: e.target.value })}
                        options={[{ value: "", label: "Од." }, ...units.map(u => ({ value: u.id, label: u.short_name }))]}
                      />
                    </div>
                    <button onClick={() => setBomItems(p => p.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-300 hover:text-red-400 shrink-0">
                      <Icon d={icons.close} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setBomModal(false)}>Скасувати</Button>
              <Button loading={bomSaving} onClick={saveBom} disabled={!bomForm.name.trim() || !bomForm.product_id}>
                {editBomId ? "Зберегти" : "Додати"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════ MODAL: ЗАМОВЛЕННЯ ═════════════════════════ */}
      {orderModal && (
        <Modal title="Нове замовлення" onClose={() => setOrderModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Номер *" value={orderForm.number} onChange={e => setOrderForm(p => ({ ...p, number: e.target.value }))} />
              <Input label="Кількість *" type="number" min="0.001" step="0.001" value={orderForm.qty} onChange={e => setOrderForm(p => ({ ...p, qty: e.target.value }))} placeholder="0" />
            </div>
            <Select label="Продукт *" value={orderForm.product_id} onChange={e => selectOrderProduct(e.target.value)}
              options={[{ value: "", label: "Оберіть продукт..." }, ...outputProducts.map(p => ({ value: p.id, label: p.name }))]}
            />
            <Select label="Специфікація (BOM)" value={orderForm.bom_id} onChange={e => setOrderForm(p => ({ ...p, bom_id: e.target.value }))}
              options={[{ value: "", label: orderBoms.length ? "Без специфікації" : "Немає специфікацій для продукту" }, ...orderBoms.map(b => ({ value: b.id, label: b.name }))]}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Склад *" value={orderForm.warehouse_id} onChange={e => setOrderForm(p => ({ ...p, warehouse_id: e.target.value }))}
                options={[{ value: "", label: "Склад..." }, ...warehouses.map(w => ({ value: w.id, label: w.name }))]}
              />
              <Input label="Дата виконання" type="date" value={orderForm.planned_date} onChange={e => setOrderForm(p => ({ ...p, planned_date: e.target.value }))} />
            </div>
            <Textarea label="Примітка" value={orderForm.notes} onChange={e => setOrderForm(p => ({ ...p, notes: e.target.value }))} placeholder="Необов'язково..." />

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setOrderModal(false)}>Скасувати</Button>
              <Button loading={orderSaving} onClick={saveOrder} disabled={!orderForm.number.trim() || !orderForm.product_id || !orderForm.qty || !orderForm.warehouse_id}>
                Створити
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
