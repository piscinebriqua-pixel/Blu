import { ArrowUpDown } from 'lucide-react';

export interface SortOption<T extends string = string> {
  value: T;
  label: string;
}

interface SortSelectorProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: SortOption<T>[];
  className?: string;
  labelPrefix?: string;
}

export function SortSelector<T extends string = string>({
  value,
  onChange,
  options,
  className = '',
  labelPrefix = 'Tri :',
}: SortSelectorProps<T>) {
  const currentOption = options.find((o) => o.value === value) || options[0];

  return (
    <div
      className={`relative inline-flex items-center min-h-[44px] px-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all ${className}`}
    >
      <div className="flex items-center gap-2 pointer-events-none w-full">
        <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
          <ArrowUpDown size={14} />
        </div>
        <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-slate-500 whitespace-nowrap overflow-hidden">
          <span className="hidden sm:inline">{labelPrefix}</span>
          <span className="text-slate-900 dark:text-white font-black truncate">
            {currentOption?.label}
          </span>
        </div>
      </div>

      {/* Select invisible par-dessus pour déclencher nativement le picker fluide sur mobile et desktop */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer text-base bg-transparent"
        aria-label="Trier la liste"
      >
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 py-2 text-base font-medium"
          >
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export default SortSelector;
