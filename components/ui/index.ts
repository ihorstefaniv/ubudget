/**
 * @file components/ui/index.ts
 * @description Єдина точка входу для всіх UI-компонентів.
 *
 * Використання:
 *   import { Button, Input, Modal, Card, Toggle, Badge, Icon, icons } from "@/components/ui";
 */

// Іконки
export { Icon, icons } from "./Icon";
export type { IconName } from "./Icon";

// Кнопка
export { Button } from "./Button";

// Поля вводу
export { Input, Select, Textarea } from "./Input";

// Модальне вікно
export { Modal } from "./Modal";

// Картки і панелі
export { Card, CardHeader, StatCard, InfoBox } from "./Card";

// Перемикач
export { Toggle, ToggleRow } from "./Toggle";

// Бейджі, прогрес, спінер
export { Badge, ProgressBar, Spinner, PageLoader } from "./Badge";

// Чекбокс
export { Checkbox, CheckboxRow } from "./Checkbox";

// Таб-навігація
export { Tabs } from "./Tabs";

// Порожній стан
export { EmptyState } from "./EmptyState";