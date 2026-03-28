import { useEffect, useState, type ReactNode } from 'react';
import styles from './create-editor.module.css';

function clampValue(value: number, min?: number, max?: number) {
  let next = value;
  if (typeof min === 'number') next = Math.max(min, next);
  if (typeof max === 'number') next = Math.min(max, next);
  return next;
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function NumberField({
  label,
  value,
  min,
  max,
  step,
  unit,
  commitOnChange,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  commitOnChange?: boolean;
  onChange: (value: number) => void;
}) {
  const [draft, setDraft] = useState(() => String(Number.isFinite(value) ? value : 0));

  useEffect(() => {
    setDraft(String(Number.isFinite(value) ? value : 0));
  }, [value]);

  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={styles.inputWrap}>
        <input
          className={`${styles.input} ${unit ? styles.inputWithSuffix : ''}`}
          type="number"
          value={draft}
          min={min}
          max={max}
          step={step}
          onChange={(event) => {
            const nextDraft = event.target.value;
            setDraft(nextDraft);

            if (!commitOnChange) {
              return;
            }

            if (nextDraft.trim() === '') {
              return;
            }

            const parsed = Number.parseFloat(nextDraft);
            if (!Number.isFinite(parsed)) {
              return;
            }

            onChange(clampValue(parsed, min, max));
          }}
          onBlur={() => {
            if (draft.trim() === '') {
              const fallback = clampValue(Number.isFinite(value) ? value : 0, min, max);
              setDraft(String(fallback));
              onChange(fallback);
              return;
            }

            const parsed = Number.parseFloat(draft);
            const nextValue = clampValue(Number.isFinite(parsed) ? parsed : value, min, max);
            setDraft(String(nextValue));
            onChange(nextValue);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.currentTarget.blur();
            }
          }}
        />
        {unit ? <span className={styles.unitSuffix}>{unit}</span> : null}
      </span>
    </label>
  );
}

export function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input
        className={styles.range}
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(clampValue(Number.parseFloat(event.target.value), min, max))}
      />
      <span className={styles.hint}>{value}</span>
    </label>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <select className={styles.select} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <input className={styles.input} type="text" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.checkboxRow}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
