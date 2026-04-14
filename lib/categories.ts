// Backward-compatible re-export — всі категорії переїхали до lib/category-registry.ts.
// Імпортуй нові речі звідти; цей файл залишений щоб не ламати наявний код.
export {
  CATEGORY_REGISTRY,
  getCategoryDef,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  BUDGET_CATEGORIES,
  TX_CATEGORIES,
  getTxCategory,
  TX_LABEL_TO_KEY,
  type CategoryDef,
  type CategoryType,
} from "./category-registry";

// ExpenseCategoryId / IncomeCategoryId — для зворотної сумісності з типами
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./category-registry";
export type ExpenseCategoryId = typeof EXPENSE_CATEGORIES[number]["id"];
export type IncomeCategoryId  = typeof INCOME_CATEGORIES[number]["id"];
