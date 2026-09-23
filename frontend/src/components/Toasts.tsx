import { useEffect, useState } from 'react';
import { IconCheck } from './Icons';

export interface ToastItem {
  id: number;
  message: string;
}

interface ToastsProps {
  items: ToastItem[];
  onDismiss: (id: number) => void;
}

function ToastRow({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setOut(true), 3200);
    const t2 = window.setTimeout(() => onDismiss(item.id), 3450);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [item.id, onDismiss]);

  return (
    <div className={`toast${out ? ' out' : ''}`}>
      <IconCheck />
      <span>{item.message}</span>
    </div>
  );
}

export function Toasts({ items, onDismiss }: ToastsProps) {
  return (
    <div className="toasts" aria-live="polite">
      {items.map((item) => (
        <ToastRow key={item.id} item={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
