"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card, CardHeader, Tabs, Input, Select, Button, Badge, Modal,
  EmptyState, Spinner, InfoBox, Icon, icons,
} from "@/components/ui";
import { fmt } from "@/lib/format";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Wh   { id: string; name: string; address: string | null }
interface Unit { id: string; name: string; short_name: string }
interface CP   { id: string; name: string }

interface Product {
  id: string; name: string; sku: string | null; type: string;
  category: string | null; unit_id: string | null;
  price: number | null; cost_price: number | null; min_stock: number | null;
  erp_units: { short_name: string; name: string } | null;
}

interface StockRow {
  product_id: string; warehouse_id: string; qty: number;
  erp_products: { name: string; type: string; category: string | null; min_stock: number | null; cost_price: number | null; erp_units: { short_name: string } | null };
  erp_warehouses: { name: string };
}

interface Movement {
  id: string; type: string; qty: number; price: number | null;
  currency: string; note: string | null; reason: string | null; created_at: string;
  erp_products: { name: string; erp_units: { short_name: string } | null } | null;
  erp_warehouses: { name: string } | null;
  erp_counterparties: { name: string } | null;
}

interface InvItem { product_id: string; expected_qty: number; actual_qty: string; name: string; unit: string }

// ─── Constants ────────────────────────────────────────────────────────────────

type WTab = "stock" | "movements" | "products" | "warehouses" | "inventory";

const TABS: { id: WTab; label: string }[] = [
  { id: "stock",      label: "Залишки"        },
  { id: "movements",  label: "Рух"            },
  { id: "products",   label: "Товари"         },
  { id: "warehouses", label: "Склади"         },
  { id: "inventory",  label: "Інвентаризація" },
];

const MOVE_META: Record<string, { label: string; color: "green" | "blue" | "red" | "orange" | "purple" }> = {
  in:         { label: "Прихід",     color: "green"  },
  out:        { label: "Розхід",     color: "blue"   },
  writeoff:   { label: "Списання",   color: "red"    },
  transfer:   { label: "Переміщення",color: "orange" },
  adjustment: { label: "Коригування",color: "purple" },
};

const MOVE_FILTER_TABS = [
  { id: "all",       label: "Всі"          },
  { id: "in",        label: "Прихід"       },
  { id: "out",       label: "Розхід"       },
  { id: "writeoff",  label: "Списання"     },
  { id: "transfer",  label: "Переміщення"  },
];

const PROD_TYPE_META: Record<string, string> = {
  product: "Товар", material: "Матеріал", service: "Послуга",
};

const WRITEOFF_REASONS = ["Пошкоджено", "Протермінувалось", "Виробничі потреби", "Власне використання", "Втрата", "Інше"];

const MOVE_INIT = { type: "in", product_id: "", warehouse_id: "", to_warehouse_id: "", qty: "", price: "", currency: "UAH", counterparty_id: "", reason: "", note: "", date: new Date().toISOString().split("T")[0] };
const PROD_INIT = { name: "", sku: "", type: "product", category: "", unit_id: "", price: "", cost_price: "", min_stock: "", description: "" };
const WARE_INIT = { name: "", address: "" };

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function WarehousePage() {
  const [tab, setTab]         = useState<WTab>("stock");
  const [loading, setLoading] = useState(true);

  // Shared
  const [companyId, setCompanyId]   = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<Wh[]>([]);
  const [units, setUnits]           = useState<Unit[]>([]);
  const [products, setProducts]     = useState<Product[]>([]);
  const [cps, setCps]               = useState<CP[]>([]);

  // Tab data
  const [stock,       setStock]       = useState<StockRow[]>([]);
  const [movements,   setMovements]   = useState<Movement[]>([]);
  const [moveFilter,  setMoveFilter]  = useState("all");
  const [whFilter,    setWhFilter]    = useState("all");
  const [prodSearch,  setProdSearch]  = useState("");
  const [stockSearch, setStockSearch] = useState("");

  // Movement modal
  const [moveModal,  setMoveModal]  = useState(false);
  const [moveForm,   setMoveForm]   = useState(MOVE_INIT);
  const [moveSaving, setMoveSaving] = useState(false);

  // Product modal
  const [prodModal,    setProdModal]    = useState(false);
  const [prodForm,     setProdForm]     = useState(PROD_INIT);
  const [editProdId,   setEditProdId]   = useState<string | null>(null);
  const [prodSaving,   setProdSaving]   = useState(false);

  // Warehouse modal
  const [wareModal,  setWareModal]  = useState(false);
  const [wareForm,   setWareForm]   = useState(WARE_INIT);
  const [wareSaving, setWareSaving] = useState(false);

  // Inventory
  const [invStep,     setInvStep]     = useState<"list" | "pick" | "count" | "done">("list");
  const [invWh,       setInvWh]       = useState("");
  const [invItems,    setInvItems]    = useState<InvItem[]>([]);
  const [invSaving,   setInvSaving]   = useState(false);
  const [pastInvs,    setPastInvs]    = useState<{ id: string; date: string; status: string; erp_warehouses: { name: string } }[]>([]);

  const supabase = createClient();

  // ─── Loaders ──────────────────────────────────────────────────────────────

  const loadAll = useCallback(async (cid: string) => {
    const [{ data: wh }, { data: un }, { data: pr }, { data: cp }, { data: st }, { data: inv }] = await Promise.all([
      supabase.from("erp_warehouses").select("id, name, address").eq("company_id", cid).eq("is_archived", false).order("name"),
      supabase.from("erp_units").select("id, name, short_name").eq("company_id", cid).order("name"),
      supabase.from("erp_products").select("id, name, sku, type, category, unit_id, price, cost_price, min_stock, erp_units(short_name, name)").eq("company_id", cid).eq("is_archived", false).order("name"),
      supabase.from("erp_counterparties").select("id, name").eq("company_id", cid).eq("is_archived", false).order("name"),
      supabase.from("erp_stock").select("product_id, warehouse_id, qty, erp_products(name, type, category, min_stock, cost_price, erp_units(short_name)), erp_warehouses(name)").eq("company_id", cid),
      supabase.from("erp_inventories").select("id, date, status, erp_warehouses(name)").eq("company_id", cid).order("created_at", { ascending: false }).limit(20),
    ]);
    setWarehouses(wh ?? []);
    setUnits(un ?? []);
    setProducts((pr as unknown as Product[]) ?? []);
    setCps(cp ?? []);
    setStock((st as unknown as StockRow[]) ?? []);
    setPastInvs((inv as unknown as typeof pastInvs) ?? []);
    setLoading(false);
  }, []); // eslint-disable-line

  const loadMovements = useCallback(async (cid: string) => {
    const { data } = await supabase
      .from("erp_stock_movements")
      .select("id, type, qty, price, currency, note, reason, created_at, erp_products(name, erp_units(short_name)), erp_warehouses(name), erp_counterparties(name)")
      .eq("company_id", cid)
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

  // ─── Save: Movement ───────────────────────────────────────────────────────

  async function saveMove() {
    if (!companyId || !moveForm.product_id || !moveForm.warehouse_id || !moveForm.qty) return;
    setMoveSaving(true);
    const qty   = parseFloat(moveForm.qty);
    const price = moveForm.price ? parseFloat(moveForm.price) : null;
    const base  = { company_id: companyId, product_id: moveForm.product_id, qty, price, currency: moveForm.currency, counterparty_id: moveForm.counterparty_id || null, note: moveForm.note || null };

    if (moveForm.type === "transfer" && moveForm.to_warehouse_id) {
      const toName   = warehouses.find(w => w.id === moveForm.to_warehouse_id)?.name ?? "";
      const fromName = warehouses.find(w => w.id === moveForm.warehouse_id)?.name ?? "";
      await Promise.all([
        supabase.from("erp_stock_movements").insert({ ...base, warehouse_id: moveForm.warehouse_id, type: "out", note: `Переміщення → ${toName}` }),
        supabase.from("erp_stock_movements").insert({ ...base, warehouse_id: moveForm.to_warehouse_id, type: "in", note: `Переміщення з ${fromName}`, counterparty_id: null }),
      ]);
    } else {
      await supabase.from("erp_stock_movements").insert({ ...base, warehouse_id: moveForm.warehouse_id, type: moveForm.type, reason: moveForm.reason || null });
    }

    await loadAll(companyId);
    if (tab === "movements") await loadMovements(companyId);
    setMoveSaving(false);
    setMoveModal(false);
    setMoveForm(MOVE_INIT);
  }

  // ─── Save: Product ────────────────────────────────────────────────────────

  async function saveProd() {
    if (!companyId || !prodForm.name.trim()) return;
    setProdSaving(true);
    const payload = { company_id: companyId, name: prodForm.name.trim(), sku: prodForm.sku || null, type: prodForm.type, category: prodForm.category || null, unit_id: prodForm.unit_id || null, price: prodForm.price ? parseFloat(prodForm.price) : null, cost_price: prodForm.cost_price ? parseFloat(prodForm.cost_price) : null, min_stock: prodForm.min_stock ? parseFloat(prodForm.min_stock) : null, description: prodForm.description || null };
    if (editProdId) {
      await supabase.from("erp_products").update(payload).eq("id", editProdId);
    } else {
      await supabase.from("erp_products").insert(payload);
    }
    await loadAll(companyId);
    setProdSaving(false);
    setProdModal(false);
    setProdForm(PROD_INIT);
    setEditProdId(null);
  }

  function openEditProd(p: Product) {
    setProdForm({ name: p.name, sku: p.sku ?? "", type: p.type, category: p.category ?? "", unit_id: p.unit_id ?? "", price: p.price?.toString() ?? "", cost_price: p.cost_price?.toString() ?? "", min_stock: p.min_stock?.toString() ?? "", description: "" });
    setEditProdId(p.id);
    setProdModal(true);
  }

  async function archiveProd(id: string) {
    if (!confirm("Архівувати товар?")) return;
    await supabase.from("erp_products").update({ is_archived: true }).eq("id", id);
    setProducts(p => p.filter(x => x.id !== id));
  }

  // ─── Save: Warehouse ──────────────────────────────────────────────────────

  async function saveWare() {
    if (!companyId || !wareForm.name.trim()) return;
    setWareSaving(true);
    await supabase.from("erp_warehouses").insert({ company_id: companyId, name: wareForm.name.trim(), address: wareForm.address || null });
    await loadAll(companyId);
    setWareSaving(false);
    setWareModal(false);
    setWareForm(WARE_INIT);
  }

  // ─── Inventory ────────────────────────────────────────────────────────────

  function startInventory() {
    if (!invWh) return;
    const whStock = stock.filter(s => s.warehouse_id === invWh);
    const items: InvItem[] = products
      .filter(p => p.type !== "service")
      .map(p => {
        const s = whStock.find(x => x.product_id === p.id);
        return { product_id: p.id, expected_qty: s?.qty ?? 0, actual_qty: "", name: p.name, unit: p.erp_units?.short_name ?? "" };
      });
    setInvItems(items);
    setInvStep("count");
  }

  async function completeInventory() {
    if (!companyId || !invWh) return;
    setInvSaving(true);
    const { data: inv } = await supabase.from("erp_inventories")
      .insert({ company_id: companyId, warehouse_id: invWh, status: "completed" })
      .select("id").single();
    if (!inv) { setInvSaving(false); return; }

    const itemsToInsert = invItems.map(i => ({ inventory_id: inv.id, product_id: i.product_id, expected_qty: i.expected_qty, actual_qty: i.actual_qty !== "" ? parseFloat(i.actual_qty) : null }));
    await supabase.from("erp_inventory_items").insert(itemsToInsert);

    // Create adjustments for differences
    const adjustments = invItems
      .filter(i => i.actual_qty !== "" && parseFloat(i.actual_qty) !== i.expected_qty)
      .map(i => {
        const actual = parseFloat(i.actual_qty);
        const diff   = actual - i.expected_qty;
        return { company_id: companyId, product_id: i.product_id, warehouse_id: invWh, type: diff > 0 ? "in" : "writeoff", qty: Math.abs(diff), reason: "Інвентаризація", note: `Інвентаризація: очікувалось ${i.expected_qty} → факт ${actual}` };
      });
    if (adjustments.length > 0) await supabase.from("erp_stock_movements").insert(adjustments);

    await loadAll(companyId);
    setInvSaving(false);
    setInvStep("done");
  }

  // ─── Derived ──────────────────────────────────────────────────────────────

  const visibleStock = stock.filter(s =>
    (whFilter === "all" || s.warehouse_id === whFilter) &&
    (!stockSearch || s.erp_products.name.toLowerCase().includes(stockSearch.toLowerCase()))
  );

  const visibleMoves = movements.filter(m => moveFilter === "all" || m.type === moveFilter);

  const visibleProds = products.filter(p =>
    !prodSearch || p.name.toLowerCase().includes(prodSearch.toLowerCase())
  );

  const totalStockValue = stock.reduce((acc, s) => acc + (s.erp_products.cost_price ?? 0) * s.qty, 0);
  const lowStockCount   = stock.filter(s => s.erp_products.min_stock != null && s.qty < (s.erp_products.min_stock ?? 0)).length;

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const mf = (k: keyof typeof MOVE_INIT) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setMoveForm(p => ({ ...p, [k]: e.target.value }));
  const pf = (k: keyof typeof PROD_INIT) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProdForm(p => ({ ...p, [k]: e.target.value }));

  function openMoveModal(type = "in", productId = "") {
    setMoveForm({ ...MOVE_INIT, type, product_id: productId, warehouse_id: warehouses[0]?.id ?? "", date: new Date().toISOString().split("T")[0] });
    setMoveModal(true);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  if (!companyId) return (
    <Card><EmptyState emoji="🏢" title="Спочатку створіть компанію" desc="Налаштування → Компанія" /></Card>
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Склад</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-neutral-500">
            <span>{products.length} товарів</span>
            <span>{warehouses.length} складів</span>
            {lowStockCount > 0 && <span className="text-red-500 font-medium">⚠ {lowStockCount} нижче мінімуму</span>}
            {totalStockValue > 0 && <span>Вартість: {fmt(totalStockValue, "UAH", 0)}</span>}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="secondary" size="sm" icon={icons.plus} onClick={() => openMoveModal("in")}>Прихід</Button>
          <Button variant="secondary" size="sm" icon={icons.minus} onClick={() => openMoveModal("out")}>Розхід</Button>
          <Button variant="danger"    size="sm" onClick={() => openMoveModal("writeoff")}>Списання</Button>
        </div>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={t => setTab(t as WTab)} variant="underline" />

      {/* ══════════════════════════ ЗАЛИШКИ ══════════════════════════════════ */}
      {tab === "stock" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input placeholder="Пошук товару..." value={stockSearch} onChange={e => setStockSearch(e.target.value)} suffix={<Icon d={icons.search} className="w-4 h-4 text-neutral-400" />} />
            </div>
            <select value={whFilter} onChange={e => setWhFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-neutral-700 dark:text-neutral-200">
              <option value="all">Всі склади</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          {visibleStock.length === 0 ? (
            <Card><EmptyState emoji="📦" title="Залишків ще немає" desc="Зробіть прихід товару" action={<Button size="sm" onClick={() => openMoveModal("in")}>Прихід</Button>} /></Card>
          ) : (
            <Card noPadding>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <th className="text-left px-5 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wide">Товар</th>
                    <th className="text-left px-3 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wide hidden sm:table-cell">Склад</th>
                    <th className="text-right px-3 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wide">Кількість</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-neutral-400 uppercase tracking-wide hidden md:table-cell">Сума</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {visibleStock.map(s => {
                    const p = s.erp_products;
                    const isLow = p.min_stock != null && s.qty < (p.min_stock ?? 0);
                    return (
                      <tr key={`${s.product_id}-${s.warehouse_id}`} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                        <td className="px-5 py-3">
                          <p className="font-medium text-neutral-800 dark:text-neutral-200">{p.name}</p>
                          {p.category && <p className="text-xs text-neutral-400">{p.category}</p>}
                        </td>
                        <td className="px-3 py-3 text-neutral-500 hidden sm:table-cell">{s.erp_warehouses.name}</td>
                        <td className="px-3 py-3 text-right">
                          <span className={`font-semibold ${isLow ? "text-red-500" : "text-neutral-800 dark:text-neutral-200"}`}>
                            {s.qty} {p.erp_units?.short_name ?? ""}
                          </span>
                          {isLow && <span className="ml-1 text-xs text-red-400">↓мін {p.min_stock}</span>}
                        </td>
                        <td className="px-5 py-3 text-right text-neutral-500 hidden md:table-cell">
                          {p.cost_price ? fmt(p.cost_price * s.qty, "UAH", 0) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════ РУХ ══════════════════════════════════════ */}
      {tab === "movements" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Tabs tabs={MOVE_FILTER_TABS} active={moveFilter} onChange={setMoveFilter} variant="pills" />
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" icon={icons.plus} onClick={() => openMoveModal("in")}>Прихід</Button>
              <Button size="sm" variant="secondary" onClick={() => openMoveModal("out")}>Розхід</Button>
              <Button size="sm" variant="danger" onClick={() => openMoveModal("writeoff")}>Списання</Button>
              <Button size="sm" variant="ghost" onClick={() => openMoveModal("transfer")}>Переміщення</Button>
            </div>
          </div>

          {visibleMoves.length === 0 ? (
            <Card><EmptyState emoji="↕️" title="Рухів ще немає" desc="Оформіть перший прихід або розхід" compact /></Card>
          ) : (
            <Card noPadding>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {visibleMoves.map(m => {
                  const meta = MOVE_META[m.type] ?? { label: m.type, color: "neutral" as const };
                  const sign = m.type === "in" ? "+" : "−";
                  return (
                    <div key={m.id} className="flex items-center gap-3 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                      <Badge color={meta.color}>{meta.label}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">
                          {m.erp_products?.name ?? "—"}
                        </p>
                        <p className="text-xs text-neutral-400 truncate">
                          {m.erp_warehouses?.name}
                          {m.erp_counterparties?.name && ` · ${m.erp_counterparties.name}`}
                          {m.reason && ` · ${m.reason}`}
                          {m.note && !m.reason && ` · ${m.note}`}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-semibold ${m.type === "in" ? "text-green-600" : "text-red-500"}`}>
                          {sign}{m.qty} {m.erp_products?.erp_units?.short_name ?? ""}
                        </p>
                        <p className="text-xs text-neutral-400">{new Date(m.created_at).toLocaleDateString("uk-UA")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════ ТОВАРИ ═══════════════════════════════════ */}
      {tab === "products" && (
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input placeholder="Пошук товару..." value={prodSearch} onChange={e => setProdSearch(e.target.value)} suffix={<Icon d={icons.search} className="w-4 h-4 text-neutral-400" />} />
            </div>
            <Button icon={icons.plus} onClick={() => { setProdForm(PROD_INIT); setEditProdId(null); setProdModal(true); }}>Додати</Button>
          </div>

          {visibleProds.length === 0 ? (
            <Card><EmptyState emoji="📋" title="Товарів ще немає" desc="Додайте товари, матеріали або послуги" action={<Button size="sm" onClick={() => { setProdForm(PROD_INIT); setEditProdId(null); setProdModal(true); }}>Додати товар</Button>} /></Card>
          ) : (
            <Card noPadding>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {visibleProds.map(p => (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3 group hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{p.name}</p>
                        <span className="text-xs text-neutral-400 hidden sm:inline">{PROD_TYPE_META[p.type] ?? p.type}</span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate">
                        {[p.sku && `SKU: ${p.sku}`, p.category, p.erp_units?.short_name].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {p.price && <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">{fmt(p.price, "UAH", 0)}</p>}
                      {p.cost_price && <p className="text-xs text-neutral-400">Собів: {fmt(p.cost_price, "UAH", 0)}</p>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => openMoveModal("in", p.id)} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-950/20 text-green-500" title="Прихід">
                        <Icon d={icons.plus} className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => openEditProd(p)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-400">
                        <Icon d={icons.edit} className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => archiveProd(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-neutral-300 hover:text-red-400">
                        <Icon d={icons.trash} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════ СКЛАДИ ═══════════════════════════════════ */}
      {tab === "warehouses" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button icon={icons.plus} onClick={() => setWareModal(true)}>Додати склад</Button>
          </div>
          {warehouses.length === 0 ? (
            <Card><EmptyState emoji="🏭" title="Складів ще немає" desc="Додайте перший склад або виробничий цех" action={<Button size="sm" onClick={() => setWareModal(true)}>Додати склад</Button>} /></Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {warehouses.map(w => {
                const whStock = stock.filter(s => s.warehouse_id === w.id);
                const totalQty = whStock.reduce((a, s) => a + s.qty, 0);
                const value    = whStock.reduce((a, s) => a + (s.erp_products.cost_price ?? 0) * s.qty, 0);
                return (
                  <Card key={w.id}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center shrink-0">
                        <Icon d={icons.bag} className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-neutral-800 dark:text-neutral-200">{w.name}</p>
                        {w.address && <p className="text-xs text-neutral-400 mt-0.5">{w.address}</p>}
                        <div className="flex gap-4 mt-2 text-xs text-neutral-500">
                          <span>{whStock.length} позицій</span>
                          <span>Заг: {totalQty} од.</span>
                          {value > 0 && <span>{fmt(value, "UAH", 0)}</span>}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════ ІНВЕНТАРИЗАЦІЯ ═══════════════════════════ */}
      {tab === "inventory" && (
        <div className="space-y-4">
          {invStep === "list" && (
            <>
              <div className="flex justify-end">
                <Button icon={icons.refresh} onClick={() => setInvStep("pick")}>Нова інвентаризація</Button>
              </div>
              {pastInvs.length === 0 ? (
                <Card><EmptyState emoji="📊" title="Інвентаризацій ще не було" desc="Проведіть першу інвентаризацію для звірки залишків" compact /></Card>
              ) : (
                <Card noPadding>
                  <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                    {pastInvs.map(inv => (
                      <div key={inv.id} className="flex items-center gap-4 px-5 py-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{inv.erp_warehouses.name}</p>
                          <p className="text-xs text-neutral-400">{new Date(inv.date).toLocaleDateString("uk-UA")}</p>
                        </div>
                        <Badge color={inv.status === "completed" ? "green" : "orange"}>
                          {inv.status === "completed" ? "Завершено" : "Чернетка"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}

          {invStep === "pick" && (
            <Card>
              <CardHeader title="Нова інвентаризація" />
              <div className="space-y-4 max-w-sm">
                <Select
                  label="Склад"
                  value={invWh}
                  onChange={e => setInvWh(e.target.value)}
                  options={[{ value: "", label: "Оберіть склад..." }, ...warehouses.map(w => ({ value: w.id, label: w.name }))]}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => setInvStep("list")}>Скасувати</Button>
                  <Button onClick={startInventory} disabled={!invWh}>Розпочати</Button>
                </div>
              </div>
            </Card>
          )}

          {invStep === "count" && (
            <div className="space-y-4">
              <Card>
                <CardHeader title={`Інвентаризація: ${warehouses.find(w => w.id === invWh)?.name}`} action={
                  <Button size="sm" variant="secondary" onClick={() => setInvStep("list")}>Скасувати</Button>
                } />
                <InfoBox variant="blue">Введіть фактичну кількість. Порожнє поле = не перевірено (залишиться без змін).</InfoBox>
                <div className="mt-4 space-y-1">
                  {invItems.map((item, i) => (
                    <div key={item.product_id} className={`flex items-center gap-3 py-2 px-1 rounded-lg ${
                      item.actual_qty !== "" && parseFloat(item.actual_qty) !== item.expected_qty
                        ? "bg-red-50 dark:bg-red-950/10" : ""
                    }`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate">{item.name}</p>
                        <p className="text-xs text-neutral-400">Очікується: {item.expected_qty} {item.unit}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          placeholder={String(item.expected_qty)}
                          value={item.actual_qty}
                          onChange={e => setInvItems(p => p.map((x, j) => j === i ? { ...x, actual_qty: e.target.value } : x))}
                          className="w-24 px-2 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
                        />
                        <span className="text-xs text-neutral-400 w-6">{item.unit}</span>
                        {item.actual_qty !== "" && parseFloat(item.actual_qty) !== item.expected_qty && (
                          <span className={`text-xs font-medium w-10 text-right ${parseFloat(item.actual_qty) > item.expected_qty ? "text-green-500" : "text-red-500"}`}>
                            {parseFloat(item.actual_qty) > item.expected_qty ? "+" : ""}{(parseFloat(item.actual_qty) - item.expected_qty).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <div className="flex justify-between items-center">
                <p className="text-sm text-neutral-500">
                  {invItems.filter(i => i.actual_qty !== "" && parseFloat(i.actual_qty) !== i.expected_qty).length} розбіжностей
                </p>
                <Button loading={invSaving} onClick={completeInventory} icon={icons.check}>Завершити і застосувати</Button>
              </div>
            </div>
          )}

          {invStep === "done" && (
            <Card>
              <div className="py-8 text-center space-y-3">
                <p className="text-4xl">✅</p>
                <p className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">Інвентаризацію завершено</p>
                <p className="text-sm text-neutral-400">Залишки оновлено відповідно до фактичних даних</p>
                <Button onClick={() => { setInvStep("list"); setInvWh(""); setInvItems([]); }}>До списку</Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ══════════════════════════ MODAL: РУХ ═══════════════════════════════ */}
      {moveModal && (
        <Modal
          title={MOVE_META[moveForm.type]?.label ?? "Новий рух"}
          onClose={() => { setMoveModal(false); setMoveForm(MOVE_INIT); }}
        >
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {MOVE_FILTER_TABS.filter(t => t.id !== "all").map(t => (
                <button
                  key={t.id}
                  onClick={() => setMoveForm(p => ({ ...p, type: t.id }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${moveForm.type === t.id ? "bg-orange-400 text-white" : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700"}`}
                >
                  {MOVE_META[t.id]?.label}
                </button>
              ))}
            </div>

            <Select label="Товар *" value={moveForm.product_id} onChange={mf("product_id")}
              options={[{ value: "", label: "Оберіть товар..." }, ...products.filter(p => p.type !== "service").map(p => ({ value: p.id, label: `${p.name}${p.erp_units ? ` (${p.erp_units.short_name})` : ""}` }))]}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select label={moveForm.type === "transfer" ? "Звідки *" : "Склад *"} value={moveForm.warehouse_id} onChange={mf("warehouse_id")}
                options={[{ value: "", label: "Склад..." }, ...warehouses.map(w => ({ value: w.id, label: w.name }))]}
              />
              {moveForm.type === "transfer" ? (
                <Select label="Куди *" value={moveForm.to_warehouse_id} onChange={mf("to_warehouse_id")}
                  options={[{ value: "", label: "Склад..." }, ...warehouses.filter(w => w.id !== moveForm.warehouse_id).map(w => ({ value: w.id, label: w.name }))]}
                />
              ) : (
                <Input label="Кількість *" type="number" min="0.001" step="0.001" value={moveForm.qty} onChange={mf("qty")} placeholder="0" />
              )}
            </div>

            {moveForm.type === "transfer" && (
              <Input label="Кількість *" type="number" min="0.001" step="0.001" value={moveForm.qty} onChange={mf("qty")} placeholder="0" />
            )}

            {(moveForm.type === "in" || moveForm.type === "out") && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Ціна за од." type="number" value={moveForm.price} onChange={mf("price")} placeholder="0.00" />
                <Select label="Контрагент" value={moveForm.counterparty_id} onChange={mf("counterparty_id")}
                  options={[{ value: "", label: "Не вказано" }, ...cps.map(c => ({ value: c.id, label: c.name }))]}
                />
              </div>
            )}

            {moveForm.type === "writeoff" && (
              <Select label="Причина *" value={moveForm.reason} onChange={mf("reason")}
                options={[{ value: "", label: "Оберіть причину..." }, ...WRITEOFF_REASONS.map(r => ({ value: r, label: r }))]}
              />
            )}

            <Input label="Примітка" value={moveForm.note} onChange={mf("note")} placeholder="Необов'язково..." />

            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setMoveModal(false); setMoveForm(MOVE_INIT); }}>Скасувати</Button>
              <Button loading={moveSaving} onClick={saveMove} disabled={!moveForm.product_id || !moveForm.warehouse_id || !moveForm.qty || (moveForm.type === "writeoff" && !moveForm.reason) || (moveForm.type === "transfer" && !moveForm.to_warehouse_id)}>
                Зберегти
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════ MODAL: ТОВАР ═════════════════════════════ */}
      {prodModal && (
        <Modal title={editProdId ? "Редагувати товар" : "Новий товар"} onClose={() => { setProdModal(false); setEditProdId(null); }}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Input label="Назва *" value={prodForm.name} onChange={pf("name")} placeholder="Чашка біла 330мл" />
              </div>
              <Select label="Тип" value={prodForm.type} onChange={pf("type")} options={PRODUCT_TYPES} />
              <Input label="SKU / Артикул" value={prodForm.sku} onChange={pf("sku")} placeholder="CUP-WHT-330" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Категорія" value={prodForm.category} onChange={pf("category")} placeholder="Чашки" />
              <Select label="Одиниця виміру" value={prodForm.unit_id} onChange={pf("unit_id")}
                options={[{ value: "", label: "Не вказано" }, ...units.map(u => ({ value: u.id, label: `${u.name} (${u.short_name})` }))]}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Ціна продажу" type="number" value={prodForm.price}      onChange={pf("price")}      placeholder="0.00" />
              <Input label="Собівартість"  type="number" value={prodForm.cost_price} onChange={pf("cost_price")} placeholder="0.00" />
              <Input label="Мін. залишок"  type="number" value={prodForm.min_stock}  onChange={pf("min_stock")}  placeholder="0" />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => { setProdModal(false); setEditProdId(null); }}>Скасувати</Button>
              <Button loading={prodSaving} onClick={saveProd} disabled={!prodForm.name.trim()}>
                {editProdId ? "Зберегти" : "Додати"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ══════════════════════════ MODAL: СКЛАД ═════════════════════════════ */}
      {wareModal && (
        <Modal title="Новий склад" onClose={() => setWareModal(false)} size="sm">
          <div className="space-y-4">
            <Input label="Назва *" value={wareForm.name}    onChange={e => setWareForm(p => ({ ...p, name: e.target.value }))}    placeholder="Основний склад" />
            <Input label="Адреса"  value={wareForm.address} onChange={e => setWareForm(p => ({ ...p, address: e.target.value }))} placeholder="м. Київ, вул. ..." />
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="secondary" onClick={() => setWareModal(false)}>Скасувати</Button>
              <Button loading={wareSaving} onClick={saveWare} disabled={!wareForm.name.trim()}>Додати</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
