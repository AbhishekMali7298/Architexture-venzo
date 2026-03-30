import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal } from './modal-portal';
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

function normalizeHex(value: string) {
  const clean = value.trim().replace(/[^0-9a-fA-F#]/g, '');
  const prefixed = clean.startsWith('#') ? clean : `#${clean}`;
  if (/^#[0-9a-fA-F]{6}$/.test(prefixed)) return prefixed.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(prefixed)) {
    const [, a, b, c] = prefixed;
    return `#${a}${a}${b}${b}${c}${c}`.toUpperCase();
  }
  return prefixed.toUpperCase();
}

export function ColorField({
  label,
  value,
  onChange,
  action,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  action?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputId = useId();
  const colorInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const previewColor = useMemo(() => {
    const normalized = normalizeHex(draft);
    return /^#[0-9A-F]{6}$/.test(normalized) ? normalized : '#FFFFFF';
  }, [draft]);

  const commit = () => {
    const normalized = normalizeHex(draft);
    if (/^#[0-9A-F]{6}$/.test(normalized)) {
      onChange(normalized);
      setDraft(normalized);
    } else {
      setDraft(value);
    }
    setOpen(false);
  };

  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.colorFieldRow}>
        <label className={styles.colorInputWrap} htmlFor={inputId}>
          <input
            id={inputId}
            className={`${styles.input} ${styles.colorTextInput}`}
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value.toUpperCase())}
            onBlur={() => {
              const normalized = normalizeHex(draft);
              if (/^#[0-9A-F]{6}$/.test(normalized)) {
                onChange(normalized);
                setDraft(normalized);
              }
            }}
          />
          <button
            className={styles.colorSwatchButton}
            type="button"
            aria-label={`Select ${label.toLowerCase()} color`}
            style={{ background: previewColor }}
            onClick={() => setOpen(true)}
          />
        </label>
        <button className={styles.iconButton} type="button" aria-label={`Open ${label.toLowerCase()} picker`} onClick={() => setOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3a3 3 0 0 0-3 3c0 1.1.6 2 1.3 2.6l-5.9 5.9a2 2 0 0 0 0 2.8l1.6 1.6a2 2 0 0 0 2.8 0l5.9-5.9A3.9 3.9 0 0 0 18 12a3 3 0 0 0-3-3c-.7 0-1.4.2-2 .5L11.5 8A3 3 0 0 0 12 3Z" />
            <path d="m5 19 2 2" />
          </svg>
        </button>
        {action}
      </div>

      {open ? (
        <Modal onClose={() => setOpen(false)}>
          <div className={styles.popoverCard}>
            <div className={styles.popoverHeader}>
              <h3 className={styles.popoverTitle}>Select Colour</h3>
              <button className={styles.popoverCloseButton} type="button" onClick={() => setOpen(false)} aria-label="Close color picker">
                ×
              </button>
            </div>

            <div className={styles.colorPickerBody}>
              <input
                ref={colorInputRef}
                className={styles.colorNativeInput}
                type="color"
                value={previewColor}
                onChange={(event) => {
                  setDraft(event.target.value.toUpperCase());
                  onChange(event.target.value.toUpperCase());
                }}
              />
            </div>

            <div className={styles.colorPickerFooter}>
              <input
                className={`${styles.input} ${styles.colorFooterInput}`}
                type="text"
                value={draft}
                onChange={(event) => setDraft(event.target.value.toUpperCase())}
              />
              <button
                className={styles.secondaryButton}
                type="button"
                aria-label="Open system color picker"
                onClick={() => colorInputRef.current?.click()}
              >
                Pick
              </button>
              <button className={styles.primaryOutlineButton} type="button" onClick={commit}>
                OK
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  onChange,
  onReset,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  onReset: () => void;
}) {
  return (
    <div className={styles.adjustmentRow}>
      <div className={styles.adjustmentHeader}>
        <span className={styles.fieldLabel}>{label}</span>
        <button className={styles.inlineAction} type="button" onClick={onReset}>
          Reset
        </button>
      </div>
      <input
        className={styles.range}
        type="range"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
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
