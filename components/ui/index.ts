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

// Бейджі, прогрес, спінер — розбито окремо щоб уникнути конфліктів
export { Badge } from "./Badge";
export { ProgressBar } from "./Badge";
export { Spinner } from "./Badge";
export { PageLoader } from "./Badge";