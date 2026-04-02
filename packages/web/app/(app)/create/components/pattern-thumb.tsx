import { useState } from 'react';
import styles from './create-editor.module.css';

export function PatternThumb({
  path,
  src,
  alt,
  size = 76,
  compact = false,
}: {
  path: string;
  src?: string | null;
  alt?: string;
  size?: number;
  compact?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = src ?? undefined;
  const showImage = Boolean(imageSrc) && !imageFailed;

  return (
    <div className={`${styles.thumbFrame} ${compact ? styles.thumbFrameCompact : ''}`}>
      {showImage ? (
        <img
          src={imageSrc}
          alt={alt ?? 'Pattern preview'}
          width={size}
          height={size}
          style={{ width: size, height: size, objectFit: 'contain' }}
          onError={() => setImageFailed(true)}
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
