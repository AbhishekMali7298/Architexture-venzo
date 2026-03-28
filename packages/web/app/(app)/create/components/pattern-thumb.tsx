import styles from './create-editor.module.css';

export function PatternThumb({
  path,
  src,
  alt,
  size = 76,
}: {
  path: string;
  src?: string | null;
  alt?: string;
  size?: number;
}) {
  return (
    <div className={styles.thumbFrame}>
      {src ? (
        <img
          src={src}
          alt={alt ?? 'Pattern preview'}
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: 'contain' }}
        />
      ) : (
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
      )}
    </div>
  );
}
