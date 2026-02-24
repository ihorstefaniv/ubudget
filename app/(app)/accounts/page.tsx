"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────
type AccountCategory =
  | "cash" | "banking" | "deposit" | "credit"
  | "installment" | "mortgage" | "property" | "crypto" | "collections";

type ModalType = AccountCategory | null;

// ─── Helpers ──────────────────────────────────────────────────
function fmt(n: number, currency = "UAH") {
  const val = Math.abs(n).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (currency === "USD") return (n < 0 ? "-" : "") + "$ " + val;
  if (currency === "EUR") return (n < 0 ? "-" : "") + "€ " + val;
  return (n < 0 ? "-" : "") + val + " грн";
}

// ─── Icons ────────────────────────────────────────────────────
const Icon = ({ d, className = "w-5 h-5" }: { d: string; className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d={d} />
  </svg>
);
const icons = {
  plus: "M12 4v16m8-8H4",
  close: "M6 18L18 6M6 6l12 12",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  chevron: "M19 9l-7 7-7-7",
  warn: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
};

// ─── Input ────────────────────────────────────────────────────
function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</label>
      <input
        {...props}
        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm placeholder:text-neutral-400 focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 focus:ring-2 focus:ring-orange-100 dark:focus:ring-orange-950 transition-all"
      />
    </div>
  );
}

function Select({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">{label}</label>
      <select
        {...props}
        className="w-full px-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-orange-300 dark:focus:border-orange-700 transition-all"
      >
        {children}
      </select>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label}</p>
        {desc && <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-10 h-5.5 rounded-full transition-colors duration-200 relative shrink-0 ${checked ? "bg-orange-400" : "bg-neutral-200 dark:bg-neutral-700"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${checked ? "translate-x-4.5" : ""}`} />
      </button>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────
function DeleteModal({ name, onConfirm, onCancel }: { name: string; onConfirm: () => void; onCancel: () => void }) {
  const [input, setInput] = useState("");
  const ready = input === "ВИДАЛИТИ";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 w-full max-w-md p-6 space-y-5 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 flex items-center justify-center shrink-0">
            <Icon d={icons.warn} className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Видалити рахунок</h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Ви видаляєте <span className="font-medium text-neutral-800 dark:text-neutral-200">"{name}"</span>.
              Всі пов'язані транзакції будуть відв'язані. Цю дію не можна скасувати.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
            Введіть <span className="font-bold text-red-500">ВИДАЛИТИ</span> для підтвердження
          </label>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="ВИДАЛИТИ"
            className="w-full px-3 py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 text-neutral-900 dark:text-neutral-100 text-sm focus:outline-none focus:border-red-400 transition-all"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-sm font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={onConfirm}
            disabled={!ready}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-600 transition-colors"
          >
            Видалити
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Wrapper ────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-t-3xl sm:rounded-2xl border-t sm:border border-neutral-100 dark:border-neutral-800 w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-neutral-200 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700 [&::-webkit-scrollbar-track]:bg-transparent">
        <div className="sticky top-0 bg-white dark:bg-neutral-900 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between z-10">
          <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors">
            <Icon d={icons.close} className="w-5 h-5" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

// ─── MODALS ───────────────────────────────────────────────────

function CashModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Додати готівку" onClose={onClose}>
      <Input label="Назва групи" placeholder="Гаманець, Копілка, Сейф..." />
      <Select label="Іконка">
        <option>👛 Гаманець</option><option>🏦 Сейф</option>
        <option>🪙 Копілка</option><option>💼 Портфель</option>
      </Select>
      <Select label="Валюта">
        <option>UAH — Гривня</option><option>USD — Долар</option>
        <option>EUR — Євро</option><option>PLN — Злотий</option>
      </Select>
      <Input label="Сума" type="number" placeholder="0.00" />
      <Input label="Опис (необов'язково)" placeholder="Для подорожей, резерв..." />
      <button onClick={onClose} className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors">
        Додати
      </button>
    </Modal>
  );
}

function BankingModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState("debit");
  const [hasService, setHasService] = useState(false);

  return (
    <Modal title="Додати банківський рахунок" onClose={onClose}>
      <Select label="Тип рахунку" value={type} onChange={(e) => setType(e.target.value)}>
        <option value="debit">Дебетова картка</option>
        <option value="credit">Кредитна картка</option>
        <option value="current">Поточний рахунок</option>
        <option value="fop">ФОП рахунок</option>
        <option value="virtual">Віртуальна картка</option>
      </Select>
      <Input label="Назва банку" placeholder="Monobank, ПриватБанк..." />
      <Input label="Назва рахунку" placeholder="Моя картка" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Баланс" type="number" placeholder="0.00" />
        <Select label="Валюта">
          <option>UAH</option><option>USD</option><option>EUR</option>
        </Select>
      </div>

      {type === "credit" && (
        <div className="space-y-3 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
          <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Кредитні параметри</p>
          <Input label="Кредитний ліміт" type="number" placeholder="0.00" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="% ставка річна" type="number" placeholder="0.00" />
            <Input label="День виписки" type="number" placeholder="25" />
          </div>
        </div>
      )}

      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
        <Toggle
          label="Плата за обслуговування"
          desc="Автоматично враховувати у витратах"
          checked={hasService}
          onChange={setHasService}
        />
        {hasService && (
          <div className="space-y-3 pt-2 border-t border-neutral-100 dark:border-neutral-700">
            <Input label="Сума" type="number" placeholder="0.00" />
            <Select label="Періодичність">
              <option>Щомісяця</option><option>Щоквартально</option><option>Щорічно</option>
            </Select>
            <Input label="День списання" type="number" placeholder="1" min="1" max="31" />
          </div>
        )}
      </div>

      <button onClick={onClose} className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors">
        Додати
      </button>
    </Modal>
  );
}

function DepositModal({ onClose }: { onClose: () => void }) {
  const [autoProlongation, setAutoProlongation] = useState(false);
  const [capitalization, setCapitalization] = useState(true);

  return (
    <Modal title="Додати депозит" onClose={onClose}>
      <Input label="Назва" placeholder="Депозит ПриватБанк" />
      <Input label="Банк" placeholder="Назва банку" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Сума" type="number" placeholder="0.00" />
        <Select label="Валюта">
          <option>UAH</option><option>USD</option><option>EUR</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="% ставка річна" type="number" placeholder="0.00" />
        <Select label="Нарахування %">
          <option>Щомісяця</option><option>Щоквартально</option><option>В кінці строку</option>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Дата відкриття" type="date" />
        <Input label="Дата закриття" type="date" />
      </div>

      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-1">
        <Toggle label="Капіталізація відсотків" desc="% додаються до тіла депозиту" checked={capitalization} onChange={setCapitalization} />
        <Toggle label="Авто пролонгація" desc="Автоматично продовжувати після закінчення" checked={autoProlongation} onChange={setAutoProlongation} />
      </div>

      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Операції з депозитом</p>
        <Select label="Рахунок для виводу %">
          <option>Monobank — основна</option><option>ПриватБанк</option>
        </Select>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Поповнити на суму" type="number" placeholder="0.00" />
          <Input label="Вивести на суму" type="number" placeholder="0.00" />
        </div>
        <p className="text-xs text-neutral-400">Виведення доступне після відкриття депозиту</p>
      </div>

      <button onClick={onClose} className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors">
        Додати
      </button>
    </Modal>
  );
}

function CreditModal({ onClose }: { onClose: () => void }) {
  const [hasHidden, setHasHidden] = useState(false);
  const [hasExtra, setHasExtra] = useState(false);
  const [rateType, setRateType] = useState("fixed");

  return (
    <Modal title="Додати кредит" onClose={onClose}>
      <Input label="Назва" placeholder="Авто кредит, Споживчий..." />
      <Input label="Банк / Кредитор" placeholder="Назва банку або особи" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Загальна сума" type="number" placeholder="0.00" />
        <Select label="Валюта">
          <option>UAH</option><option>USD</option><option>EUR</option>
        </Select>
      </div>
      <Input label="Залишок боргу" type="number" placeholder="0.00" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Щомісячний платіж" type="number" placeholder="0.00" />
        <Input label="Дата платежу (день)" type="number" placeholder="15" min="1" max="31" />
      </div>

      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Відсоткова ставка</p>
        <Select label="Тип ставки" value={rateType} onChange={(e) => setRateType(e.target.value)}>
          <option value="fixed">Фіксована</option>
          <option value="float">Плаваюча</option>
        </Select>
        <Input label="% ставка річна" type="number" placeholder="0.00" />
        {rateType === "float" && <Input label="Максимальна ставка" type="number" placeholder="0.00" />}
      </div>

      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
        <Toggle label="Приховані платежі" desc="Страховка, комісії, обслуговування" checked={hasHidden} onChange={setHasHidden} />
        {hasHidden && (
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
            <Input label="Страховка (на рік)" type="number" placeholder="0.00" />
            <Input label="Комісія за обслуговування (на місяць)" type="number" placeholder="0.00" />
            <Input label="Інші приховані платежі" type="number" placeholder="0.00" />
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
        <Toggle label="Додаткові витрати" desc="Разові або нерегулярні витрати по кредиту" checked={hasExtra} onChange={setHasExtra} />
        {hasExtra && (
          <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-neutral-700">
            <Input label="Назва витрати" placeholder="Оцінка майна, нотаріус..." />
            <Input label="Сума" type="number" placeholder="0.00" />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="Дата відкриття" type="date" />
        <Input label="Дата закриття" type="date" />
      </div>

      <button onClick={onClose} className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors">
        Додати
      </button>
    </Modal>
  );
}

function InstallmentModal({ onClose }: { onClose: () => void }) {
  const [hasPercent, setHasPercent] = useState(false);
  const [model, setModel] = useState("1");

  return (
    <Modal title="Оплата частинами" onClose={onClose}>
      <Input label="На що (товар / послуга)" placeholder="iPhone 15, Курс, Меблі..." />
      <Input label="Магазин / Продавець" placeholder="Назва" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Загальна сума" type="number" placeholder="0.00" />
        <Input label="Кількість частин" type="number" placeholder="12" />
      </div>
      <Input label="Вже сплачено частин" type="number" placeholder="0" />

      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Модель оплати</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { val: "1", label: "З 1-го місяця", desc: "Перший платіж одразу" },
            { val: "2", label: "З 2-го місяця", desc: "Перший платіж через місяць" },
          ].map(({ val, label, desc }) => (
            <button
              key={val}
              onClick={() => setModel(val)}
              className={`p-3 rounded-xl border text-left transition-all ${
                model === val
                  ? "border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-950/30"
                  : "border-neutral-200 dark:border-neutral-700 hover:border-neutral-300"
              }`}
            >
              <p className={`text-sm font-medium ${model === val ? "text-orange-500" : "text-neutral-800 dark:text-neutral-200"}`}>{label}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{desc}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700 space-y-3">
        <Toggle label="Додати %" desc="Якщо розтермінування з відсотками" checked={hasPercent} onChange={setHasPercent} />
        {hasPercent && <Input label="% ставка річна" type="number" placeholder="0.00" />}
      </div>

      <Input label="Дата першого платежу" type="date" />

      <button onClick={onClose} className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors">
        Додати
      </button>
    </Modal>
  );
}

function MortgageModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Іпотека" onClose={onClose}>
      <Input label="Назва об'єкту" placeholder="Квартира на Хрещатику..." />
      <Input label="Банк" placeholder="Назва банку" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Вартість об'єкту" type="number" placeholder="0.00" />
        <Input label="Перший внесок" type="number" placeholder="0.00" />
      </div>
      <Input label="Сума кредиту" type="number" placeholder="Розраховується автоматично" readOnly />
      <div className="grid grid-cols-2 gap-3">
        <Input label="% ставка річна" type="number" placeholder="0.00" />
        <Input label="Страховка (на рік)" type="number" placeholder="0.00" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Строк (роки)" type="number" placeholder="20" />
        <Input label="Дата видачі" type="date" />
      </div>
      <Input label="Залишок боргу" type="number" placeholder="0.00" />
      <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30">
        <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">💡 Щомісячний платіж розраховується автоматично на основі суми, ставки та строку</p>
      </div>
      <Input label="День платежу" type="number" placeholder="15" min="1" max="31" />
      <button onClick={onClose} className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors">
        Додати
      </button>
    </Modal>
  );
}

function PropertyModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Розтермінування нерухомості" onClose={onClose}>
      <Input label="Назва об'єкту" placeholder="ЖК Сонячний, кв. 45" />
      <Input label="Адреса" placeholder="вул. Шевченка, 12" />
      <Input label="Забудовник" placeholder="Назва компанії" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Загальна вартість" type="number" placeholder="0.00" />
        <Select label="Валюта">
          <option>UAH</option><option>USD</option><option>EUR</option>
        </Select>
      </div>
      <Input label="Вже сплачено" type="number" placeholder="0.00" />
      <Select label="Статус об'єкту">
        <option>🏗 Будується</option>
        <option>✅ Здано</option>
        <option>📋 Планується</option>
      </Select>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Дата договору" type="date" />
        <Input label="Плановий термін здачі" type="date" />
      </div>
      <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-700">
        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">Графік платежів</p>
        <p className="text-xs text-neutral-400">Довільний графік — різні суми в різні дати. Можна додати після створення.</p>
      </div>
      <button onClick={onClose} className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors">
        Додати
      </button>
    </Modal>
  );
}

function CryptoModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState("crypto");
  return (
    <Modal title="Крипто & Метали" onClose={onClose}>
      <div className="grid grid-cols-2 gap-2">
        {[{ val: "crypto", label: "🪙 Крипто" }, { val: "metal", label: "🥇 Метали" }].map(({ val, label }) => (
          <button key={val} onClick={() => setType(val)}
            className={`py-2.5 rounded-xl border text-sm font-medium transition-all ${
              type === val ? "border-orange-300 bg-orange-50 dark:bg-orange-950/30 text-orange-500" : "border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400"
            }`}>{label}</button>
        ))}
      </div>

      {type === "crypto" && (
        <>
          <Select label="Монета">
            <option>Bitcoin (BTC)</option><option>Ethereum (ETH)</option>
            <option>USDT</option><option>BNB</option><option>Інша...</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Кількість" type="number" placeholder="0.00000000" />
            <Input label="Ціна купівлі (USD)" type="number" placeholder="0.00" />
          </div>
          <Input label="Гаманець / Біржа (необов'язково)" placeholder="Binance, MetaMask..." />
        </>
      )}

      {type === "metal" && (
        <>
          <Select label="Метал">
            <option>🥇 Золото</option><option>🥈 Срібло</option><option>Платина</option>
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Кількість (грами)" type="number" placeholder="0.00" />
            <Input label="Ціна купівлі (грн/г)" type="number" placeholder="0.00" />
          </div>
          <Input label="Де зберігається" placeholder="Банк, вдома..." />
        </>
      )}

      <button onClick={onClose} className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors">
        Додати
      </button>
    </Modal>
  );
}

function CollectionModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Додати колекційний актив" onClose={onClose}>
      <Input label="Назва" placeholder="Монета 1 карбованець 1961р." />
      <Select label="Категорія">
        <option>🪙 Нумізматика</option><option>📮 Філателія</option>
        <option>🖼 Мистецтво</option><option>🪑 Антикваріат</option>
        <option>🎵 Вініл</option><option>🎖 Військові артефакти</option><option>Інше</option>
      </Select>
      <Input label="Опис" placeholder="Деталі, рік, стан..." />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Ціна купівлі (грн)" type="number" placeholder="0.00" />
        <Input label="Ціна купівлі (USD)" type="number" placeholder="0.00" />
      </div>
      <Input label="Очікувана ціна продажу (грн)" type="number" placeholder="0.00" />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Дата придбання" type="date" />
        <Select label="Статус">
          <option>✅ Власність</option><option>💰 Продано</option>
        </Select>
      </div>
      <button onClick={onClose} className="w-full py-3 rounded-xl bg-orange-400 text-white font-semibold hover:bg-orange-500 transition-colors">
        Додати
      </button>
    </Modal>
  );
}

// ─── Account Card ─────────────────────────────────────────────
function AccountCard({ name, sub, balance, currency = "UAH", badge, onDelete }: {
  name: string; sub: string; balance: number; currency?: string; badge?: string; onDelete: () => void;
}) {
  return (
    <div className="group flex items-center justify-between p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-orange-200 dark:hover:border-orange-900 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-base shrink-0">
          {badge ?? "💳"}
        </div>
        <div>
          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{name}</p>
          <p className="text-xs text-neutral-400">{sub}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{fmt(balance, currency)}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:text-orange-400 flex items-center justify-center transition-colors">
            <Icon d={icons.edit} className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg bg-neutral-50 dark:bg-neutral-800 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors"
          >
            <Icon d={icons.trash} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────
function Section({ title, total, currency = "UAH", onAdd, children, defaultOpen = true }: {
  title: string; total: number; currency?: string; onAdd: () => void; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon d={icons.chevron} className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          <span className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{title}</span>
        </div>
        <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">{fmt(total, currency)}</span>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-neutral-50 dark:border-neutral-800 pt-3">
          {children}
          <button
            onClick={onAdd}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-700 text-neutral-500 dark:text-neutral-400 text-sm hover:border-orange-300 dark:hover:border-orange-700 hover:text-orange-400 transition-all"
          >
            <Icon d={icons.plus} className="w-4 h-4" />
            Додати
          </button>
        </div>
      )}
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function AccountsPage() {
  const [modal, setModal] = useState<ModalType>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ name: string } | null>(null);

  const netWorth = 124500;
  const breakdown = { cash: 8200, banking: 67300, deposits: 25000, credits: -12000, crypto: 18000, collections: 18000 };

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Рахунки & Активи</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Повна фінансова картина</p>
      </div>

      {/* ── Net Worth ── */}
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-6">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1">Баланс моїх активів</p>
        <p className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 mb-5">{fmt(netWorth)}</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[
            { label: "Готівка", val: breakdown.cash, color: "text-emerald-500" },
            { label: "Рахунки", val: breakdown.banking, color: "text-blue-500" },
            { label: "Депозити", val: breakdown.deposits, color: "text-violet-500" },
            { label: "Борги", val: breakdown.credits, color: "text-red-500" },
            { label: "Крипто", val: breakdown.crypto, color: "text-amber-500" },
            { label: "Колекції", val: breakdown.collections, color: "text-pink-500" },
          ].map(({ label, val, color }) => (
            <div key={label} className="text-center p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
              <p className={`text-sm font-bold ${color}`}>{val < 0 ? "-" : "+"}{fmt(Math.abs(val))}</p>
              <p className="text-xs text-neutral-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Sections ── */}
      <Section title="💵 Готівка" total={8200} onAdd={() => setModal("cash")}>
        <AccountCard name="Гаманець" sub="UAH · EUR · USD" balance={4200} onDelete={() => setDeleteTarget({ name: "Гаманець" })} badge="👛" />
        <AccountCard name="Копілка" sub="UAH" balance={4000} onDelete={() => setDeleteTarget({ name: "Копілка" })} badge="🪙" />
      </Section>

      <Section title="💳 Банківські рахунки" total={67300} onAdd={() => setModal("banking")}>
        <AccountCard name="Monobank" sub="Дебетова · UAH" balance={14200} onDelete={() => setDeleteTarget({ name: "Monobank" })} badge="🟡" />
        <AccountCard name="ПриватБанк" sub="Дебетова · UAH" balance={8700} onDelete={() => setDeleteTarget({ name: "ПриватБанк" })} badge="🟢" />
        <AccountCard name="Кредитна Mono" sub="Кредитна · ліміт 20 000 грн" balance={-3400} onDelete={() => setDeleteTarget({ name: "Кредитна Mono" })} badge="🔴" />
      </Section>

      <Section title="🏦 Депозити" total={25000} onAdd={() => setModal("deposit")}>
        <AccountCard name="Депозит ПриватБанк" sub="14.5% річних · до 01.06.2025" balance={25000} onDelete={() => setDeleteTarget({ name: "Депозит ПриватБанк" })} badge="📈" />
      </Section>

      <Section title="💸 Кредити" total={-12000} onAdd={() => setModal("credit")}>
        <AccountCard name="Споживчий кредит" sub="Укрсиббанк · 18% · до 2026" balance={-12000} onDelete={() => setDeleteTarget({ name: "Споживчий кредит" })} badge="📋" />
      </Section>

      <Section title="🛒 Оплата частинами" total={-8400} onAdd={() => setModal("installment")} defaultOpen={false}>
        <AccountCard name="iPhone 15 Pro" sub="8 з 12 частин · Monobank" balance={-8400} onDelete={() => setDeleteTarget({ name: "iPhone 15 Pro" })} badge="📱" />
      </Section>

      <Section title="🏠 Іпотека" total={-180000} onAdd={() => setModal("mortgage")} defaultOpen={false}>
        <AccountCard name="Квартира вул. Шевченка" sub="ОТП Банк · 7% · 20 років" balance={-180000} onDelete={() => setDeleteTarget({ name: "Квартира" })} badge="🏠" />
      </Section>

      <Section title="🏗 Розтермінування нерухомості" total={-45000} onAdd={() => setModal("property")} defaultOpen={false}>
        <AccountCard name="ЖК Сонячний, кв. 45" sub="Будується · здача 2026" balance={-45000} onDelete={() => setDeleteTarget({ name: "ЖК Сонячний" })} badge="🏗" />
      </Section>

      <Section title="🪙 Крипто & Метали" total={18000} onAdd={() => setModal("crypto")} defaultOpen={false}>
        <AccountCard name="Bitcoin" sub="0.00412 BTC · Binance" balance={12000} onDelete={() => setDeleteTarget({ name: "Bitcoin" })} badge="₿" />
        <AccountCard name="Золото" sub="5г · НБУ курс" balance={6000} onDelete={() => setDeleteTarget({ name: "Золото" })} badge="🥇" />
      </Section>

      <Section title="🎨 Колекції" total={18000} onAdd={() => setModal("collections")} defaultOpen={false}>
        <AccountCard name="Монета 1 карб. 1961р." sub="Нумізматика · відмінний стан" balance={4500} onDelete={() => setDeleteTarget({ name: "Монета" })} badge="🪙" />
      </Section>

      {/* ── Modals ── */}
      {modal === "cash" && <CashModal onClose={() => setModal(null)} />}
      {modal === "banking" && <BankingModal onClose={() => setModal(null)} />}
      {modal === "deposit" && <DepositModal onClose={() => setModal(null)} />}
      {modal === "credit" && <CreditModal onClose={() => setModal(null)} />}
      {modal === "installment" && <InstallmentModal onClose={() => setModal(null)} />}
      {modal === "mortgage" && <MortgageModal onClose={() => setModal(null)} />}
      {modal === "property" && <PropertyModal onClose={() => setModal(null)} />}
      {modal === "crypto" && <CryptoModal onClose={() => setModal(null)} />}
      {modal === "collections" && <CollectionModal onClose={() => setModal(null)} />}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <DeleteModal
          name={deleteTarget.name}
          onConfirm={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}