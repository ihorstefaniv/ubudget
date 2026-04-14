/**
 * Єдиний реєстр категорій — джерело правди для транзакцій, бюджету та будь-якого іншого розділу.
 * Змінювати список тут — зміни автоматично поширюються скрізь.
 */

export type CategoryType = "expense" | "income" | "transfer";

export interface CategoryDef {
  /** Унікальний ключ. Зберігається у transactions.category_key та budgets.category_key */
  id: string;
  label: string;
  emoji: string;
  type: CategoryType;
  /**
   * false → не відображати рядком у бюджеті і не рахувати у витратах/доходах бюджету.
   * Наприклад "transfer": гроші не зникають, просто не входять до бюджетного обліку.
   */
  showInBudget: boolean;
}

export const CATEGORY_REGISTRY: readonly CategoryDef[] = [
  // ── Витрати ──────────────────────────────────────────────────────────────────
  { id: "food",          label: "Продукти",      emoji: "🛒", type: "expense", showInBudget: true  },
  { id: "cafe",          label: "Кафе",           emoji: "☕", type: "expense", showInBudget: true  },
  { id: "transport",     label: "Транспорт",      emoji: "🚗", type: "expense", showInBudget: true  },
  { id: "fuel",          label: "Пальне",         emoji: "⛽", type: "expense", showInBudget: true  },
  { id: "health",        label: "Здоров'я",       emoji: "💊", type: "expense", showInBudget: true  },
  { id: "housing",       label: "Комунальні",     emoji: "🏠", type: "expense", showInBudget: true  },
  { id: "clothes",       label: "Одяг",           emoji: "👗", type: "expense", showInBudget: true  },
  { id: "entertainment", label: "Розваги",        emoji: "🎮", type: "expense", showInBudget: true  },
  { id: "education",     label: "Освіта",         emoji: "📚", type: "expense", showInBudget: true  },
  { id: "sport",         label: "Спорт",          emoji: "🏃", type: "expense", showInBudget: true  },
  { id: "beauty",        label: "Краса",          emoji: "💄", type: "expense", showInBudget: true  },
  { id: "pets",          label: "Тварини",        emoji: "🐾", type: "expense", showInBudget: true  },
  { id: "gifts",         label: "Подарунки",      emoji: "🎁", type: "expense", showInBudget: true  },
  { id: "other",         label: "Інше",           emoji: "📦", type: "expense", showInBudget: true  },
  // ── Доходи ───────────────────────────────────────────────────────────────────
  { id: "salary",        label: "Зарплата",       emoji: "💼", type: "income",  showInBudget: true  },
  { id: "freelance",     label: "Фріланс",        emoji: "💻", type: "income",  showInBudget: true  },
  { id: "business",      label: "Бізнес",         emoji: "🏪", type: "income",  showInBudget: true  },
  { id: "invest",        label: "Інвестиції",     emoji: "📈", type: "income",  showInBudget: true  },
  { id: "gift",          label: "Подарунок",      emoji: "🎀", type: "income",  showInBudget: true  },
  { id: "refund",        label: "Повернення",     emoji: "↩️", type: "income",  showInBudget: true  },
  { id: "other_in",      label: "Інший дохід",    emoji: "💰", type: "income",  showInBudget: true  },
  // ── Технічні — не відображаються у бюджеті ───────────────────────────────────
  { id: "transfer",      label: "Переказ",        emoji: "↔️", type: "transfer", showInBudget: false },
  // ── Fallback — транзакції без категорії ───────────────────────────────────────
  { id: "uncategorized", label: "Без категорії",  emoji: "📂", type: "expense",  showInBudget: true  },
];

// ── Індекси для O(1) пошуку ───────────────────────────────────────────────────

const _byId: Record<string, CategoryDef> = {};
CATEGORY_REGISTRY.forEach(c => { _byId[c.id] = c; });

/** Повертає CategoryDef за ключем або generic-fallback якщо ключ невідомий. */
export function getCategoryDef(id: string): CategoryDef {
  return _byId[id] ?? { id, label: id, emoji: "📦", type: "expense", showInBudget: true };
}

// ── Зручні зрізи ─────────────────────────────────────────────────────────────

export const EXPENSE_CATEGORIES = CATEGORY_REGISTRY.filter(
  c => c.type === "expense" && c.id !== "uncategorized",
) as CategoryDef[];

export const INCOME_CATEGORIES = CATEGORY_REGISTRY.filter(
  c => c.type === "income",
) as CategoryDef[];

export const BUDGET_CATEGORIES = CATEGORY_REGISTRY.filter(
  c => c.showInBudget,
) as CategoryDef[];

// ── Backward-compatible exports (щоб не ламати існуючий код) ──────────────────

/** @deprecated Використовуй EXPENSE_CATEGORIES / INCOME_CATEGORIES */
export const TX_CATEGORIES = {
  expense: EXPENSE_CATEGORIES,
  income:  INCOME_CATEGORIES,
} as const;

/** @deprecated Використовуй getCategoryDef() */
export function getTxCategory(
  type: "expense" | "income" | "transfer",
  key: string,
): CategoryDef {
  if (type === "transfer") return getCategoryDef("transfer");
  return getCategoryDef(key);
}

/** label (lowercase) → id — для матчингу довільних рядків */
export const TX_LABEL_TO_KEY: Record<string, string> = {};
CATEGORY_REGISTRY.forEach(c => { TX_LABEL_TO_KEY[c.label.toLowerCase()] = c.id; });
