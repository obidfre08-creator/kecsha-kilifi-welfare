import React from 'react';

export interface ToastItem {
  id: string;
  msg: string;
  kind?: 'info' | 'err';
}

interface ToastContainerProps {
  toasts: ToastItem[];
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  return (
    <div id="toasts">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast ${t.kind === 'err' ? 'err' : ''}`}
          dangerouslySetInnerHTML={{ __html: t.msg }}
        />
      ))}
    </div>
  );
};
