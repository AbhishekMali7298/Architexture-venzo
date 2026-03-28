import styles from './create-editor.module.css';

export function PatternThumb({ path, size = 76 }: { path: string; size?: number }) {
  return (
    <div className={styles.thumbFrame}>
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        style={{ color: '#334155' }}
      >
        <path d={path} />
      </svg>
    </div>
  );
}
