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

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex);
  const safeHex = /^#[0-9A-F]{6}$/.test(normalized) ? normalized : '#FFFFFF';
  const value = Number.parseInt(safeHex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((channel) => Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  let hue = 0;

  if (delta !== 0) {
    if (max === red) hue = ((green - blue) / delta) % 6;
    else if (max === green) hue = (blue - red) / delta + 2;
    else hue = (red - green) / delta + 4;
  }

  hue = Math.round(hue * 60);
  if (hue < 0) hue += 360;

  const saturation = max === 0 ? 0 : delta / max;
  const value = max;

  return [hue, saturation, value];
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const hue = ((h % 360) + 360) % 360;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const match = v - chroma;
  let rgb: [number, number, number] = [0, 0, 0];

  if (hue < 60) rgb = [chroma, x, 0];
  else if (hue < 120) rgb = [x, chroma, 0];
  else if (hue < 180) rgb = [0, chroma, x];
  else if (hue < 240) rgb = [0, x, chroma];
  else if (hue < 300) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  return rgb.map((channel) => (channel + match) * 255) as [number, number, number];
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
  const paletteRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const [picker, setPicker] = useState(() => {
    const [r, g, b] = hexToRgb(value);
    const [h, s, v] = rgbToHsv(r, g, b);
    return { h, s, v };
  });

  useEffect(() => {
    setDraft(value);
    const [r, g, b] = hexToRgb(value);
    const [h, s, v] = rgbToHsv(r, g, b);
    setPicker({ h, s, v });
  }, [value]);

  const previewColor = useMemo(() => {
    const [r, g, b] = hsvToRgb(picker.h, picker.s, picker.v);
    return rgbToHex(r, g, b);
  }, [picker]);

  const hueColor = useMemo(() => rgbToHex(...hsvToRgb(picker.h, 1, 1)), [picker.h]);

  const commit = () => {
    onChange(previewColor);
    setDraft(previewColor);
    setOpen(false);
  };

  const updateFromPalette = (clientX: number, clientY: number) => {
    const palette = paletteRef.current;
    if (!palette) return;
    const rect = palette.getBoundingClientRect();
    const x = clampValue(clientX - rect.left, 0, rect.width);
    const y = clampValue(clientY - rect.top, 0, rect.height);
    const nextS = rect.width === 0 ? 0 : x / rect.width;
    const nextV = rect.height === 0 ? 0 : 1 - y / rect.height;
    setPicker((current) => ({ ...current, s: nextS, v: nextV }));
  };

  const updateFromHue = (clientY: number) => {
    const hueElement = hueRef.current;
    if (!hueElement) return;
    const rect = hueElement.getBoundingClientRect();
    const y = clampValue(clientY - rect.top, 0, rect.height);
    const nextHue = rect.height === 0 ? 0 : (y / rect.height) * 360;
    setPicker((current) => ({ ...current, h: nextHue }));
  };

  const attachDrag = (
    event: React.MouseEvent<HTMLDivElement>,
    updater: (clientX: number, clientY: number) => void,
  ) => {
    event.preventDefault();
    updater(event.clientX, event.clientY);
    const onMove = (moveEvent: MouseEvent) => updater(moveEvent.clientX, moveEvent.clientY);
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const paletteHandleLeft = `${picker.s * 100}%`;
  const paletteHandleTop = `${(1 - picker.v) * 100}%`;
  const hueHandleTop = `${(picker.h / 360) * 100}%`;

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
            onChange={(event) => {
              const next = event.target.value.toUpperCase();
              setDraft(next);
              const normalized = normalizeHex(next);
              if (/^#[0-9A-F]{6}$/.test(normalized)) {
                const [r, g, b] = hexToRgb(normalized);
                const [h, s, v] = rgbToHsv(r, g, b);
                setPicker({ h, s, v });
                onChange(normalized);
              }
            }}
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 4.5 19.5 10c.7.7.7 1.8 0 2.5l-4.2 4.2c-.4.4-.9.6-1.4.6H9.5a2 2 0 0 1-2-2v-4.4c0-.5.2-1 .6-1.4l4.2-4.2c.7-.7 1.8-.7 2.5 0Z" />
            <path d="m12 6 6 6" />
            <path d="M6 18h8" />
            <path d="M5 20.5h10" />
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
              <div className={styles.colorPickerCanvas}>
                <div
                  ref={paletteRef}
                  className={styles.colorPalette}
                  style={{ backgroundColor: hueColor }}
                  onMouseDown={(event) => attachDrag(event, (clientX, clientY) => updateFromPalette(clientX, clientY))}
                >
                  <div className={styles.colorPaletteWhite} />
                  <div className={styles.colorPaletteBlack} />
                  <div
                    className={styles.colorPaletteHandle}
                    style={{ left: paletteHandleLeft, top: paletteHandleTop, background: previewColor }}
                  />
                </div>
                <div
                  ref={hueRef}
                  className={styles.colorHue}
                  onMouseDown={(event) => attachDrag(event, (_, clientY) => updateFromHue(clientY))}
                >
                  <div className={styles.colorHueHandle} style={{ top: hueHandleTop }} />
                </div>
              </div>
            </div>

            <div className={styles.colorPickerFooter}>
              <input
                className={`${styles.input} ${styles.colorFooterInput}`}
                type="text"
                value={previewColor}
                onChange={(event) => {
                  const normalized = normalizeHex(event.target.value);
                  setDraft(event.target.value.toUpperCase());
                  if (/^#[0-9A-F]{6}$/.test(normalized)) {
                    const [r, g, b] = hexToRgb(normalized);
                    const [h, s, v] = rgbToHsv(r, g, b);
                    setPicker({ h, s, v });
                    onChange(normalized);
                  }
                }}
              />
              <span className={styles.colorPreviewChip} style={{ background: previewColor }} />
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
