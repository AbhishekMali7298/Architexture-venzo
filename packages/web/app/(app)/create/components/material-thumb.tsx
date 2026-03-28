import styles from './create-editor.module.css';

function lighten(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((n >> 16) & 255) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amount));
  const b = Math.min(255, Math.max(0, (n & 255) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function MaterialThumb({ color, src, alt, size = 76 }: { color: string; src?: string | null; alt?: string; size?: number }) {
  return (
    <div className={styles.thumbFrame}>
      {src ? (
        <img
          src={src}
          alt={alt ?? 'Material thumbnail'}
          style={{
            width: size - 10,
            height: size - 10,
            borderRadius: '50%',
            objectFit: 'cover',
            border: '1px solid rgba(15, 23, 42, 0.08)',
          }}
        />
      ) : (
        <div
          style={{
            width: size - 10,
            height: size - 10,
            borderRadius: '50%',
            border: '1px solid rgba(15, 23, 42, 0.08)',
            background: `radial-gradient(circle at 30% 30%, ${lighten(color, 22)}, transparent 58%), radial-gradient(circle at 70% 70%, ${lighten(color, -18)}, transparent 42%), ${color}`,
          }}
        />
      )}
    </div>
  );
}
