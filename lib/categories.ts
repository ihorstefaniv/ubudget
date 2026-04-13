// Спільний довідник категорій транзакцій.
// Використовується в /transactions і /budget для однакового зв'язку category_key.

export const TX_CATEGORIES = {
  expense: [
    { id: "food",          label: "Продукти",   emoji: "🛒" },
    { id: "cafe",          label: "Кафе",        emoji: "☕" },
    { id: "transport",     label: "Транспорт",   emoji: "🚗" },
    { id: "fuel",          label: "Пальне",      emoji: "⛽" },
    { id: "health",        label: "Здоров'я",    emoji: "💊" },
    { id: "housing",       label: "Комунальні",  emoji: "🏠" },
    { id: "clothes",       label: "Одяг",        emoji: "👗" },
    { id: "entertainment", label: "Розваги",     emoji: "🎮" },
    { id: "education",     label: "Освіта",      emoji: "📚" },
    { id: "sport",         label: "Спорт",       emoji: "🏃" },
    { id: "beauty",        label: "Краса",       emoji: "💄" },
    { id: "pets",          label: "Тварини",     emoji: "🐾" },
    { id: "gifts",         label: "Подарунки",   emoji: "🎁" },
    { id: "other",         label: "Інше",        emoji: "📦" },
  ],
  income: [
    { id: "salary",    label: "Зарплата",    emoji: "💼" },
    { id: "freelance", label: "Фріланс",     emoji: "💻" },
    { id: "business",  label: "Бізнес",      emoji: "🏪" },
    { id: "invest",    label: "Інвестиції",  emoji: "📈" },
    { id: "gift",      label: "Подарунок",   emoji: "🎀" },
    { id: "refund",    label: "Повернення",  emoji: "↩️" },
    { id: "other_in",  label: "Інший дохід", emoji: "💰" },
  ],
} as const;

export type ExpenseCategoryId = typeof TX_CATEGORIES.expense[number]["id"];
export type IncomeCategoryId  = typeof TX_CATEGORIES.income[number]["id"];

/** Повертає emoji + label для заданого type і key, або fallback. */
export function getTxCategory(type: "expense" | "income" | "transfer", key: string) {
  if (type === "transfer") return { emoji: "↔️", label: "Переказ" };
  const list = type === "expense" ? TX_CATEGORIES.expense : TX_CATEGORIES.income;
  return (list as readonly { id: string; label: string; emoji: string }[]).find(c => c.id === key)
    ?? { emoji: "📦", label: key };
}

/** Зворотній індекс: label (lowercase) → id, для матчингу назв бюджетних категорій. */
export const TX_LABEL_TO_KEY: Record<string, string> = {};
[...TX_CATEGORIES.expense, ...TX_CATEGORIES.income].forEach(c => {
  TX_LABEL_TO_KEY[c.label.toLowerCase()] = c.id;
});
