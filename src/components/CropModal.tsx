import React, { useState, useRef, useEffect } from 'react';

interface CropModalProps {
  isOpen: boolean;
  imageSrc: string | null;
  aspectRatio: number; // e.g. 45 / 35 for passport photo or 1 for square logo
  onCancel: () => void;
  onApply: (croppedDataUrl: string) => void;
}

export const CropModal: React.FC<CropModalProps> = ({
  isOpen,
  imageSrc,
  aspectRatio,
  onCancel,
  onApply,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const posStartRef = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);

  const vw = 280;
  const vh = Math.round(vw * aspectRatio);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setPos({ x: 0, y: 0 });
    }
  }, [isOpen, imageSrc]);

  if (!isOpen || !imageSrc) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    posStartRef.current = { ...pos };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPos({
      x: posStartRef.current.x + dx,
      y: posStartRef.current.y + dy,
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    const img = imgRef.current;
    if (!img) return;

    const base = Math.max(vw / img.naturalWidth, vh / img.naturalHeight);
    const ds = base * zoom;
    const srcW = vw / ds;
    const srcH = vh / ds;

    let sx = (img.naturalWidth - srcW) / 2 - pos.x / ds;
    let sy = (img.naturalHeight - srcH) / 2 - pos.y / ds;

    sx = Math.max(0, Math.min(sx, img.naturalWidth - srcW));
    sy = Math.max(0, Math.min(sy, img.naturalHeight - srcH));

    const outW = aspectRatio > 1.2 ? 413 : 512;
    const outH = Math.round(outW * aspectRatio);

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, outW, outH);
      onApply(canvas.toDataURL('image/jpeg', 0.9));
    } else {
      onCancel();
    }
  };

  return (
    <div className="cmodal">
      <div className="cbox">
        <h3>Crop photo</h3>
        <p className="psub">
          {aspectRatio > 1.2
            ? 'Passport format — 35 × 45 mm (413 × 531 px @300 DPI) · drag to position'
            : 'Square crop for association logo'}
        </p>

        <div
          className="cropwrap"
          style={{ height: `${vh}px`, cursor: isDragging ? 'grabbing' : 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Crop target"
            id="cropImg"
            style={{
              transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
              maxWidth: 'none',
            }}
          />
        </div>

        <label className="zoomlab">
          Zoom{' '}
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ width: '180px' }}
          />
        </label>

        <div className="actions" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn gho" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn pri" onClick={handleCrop}>
            Apply crop
          </button>
        </div>
      </div>
    </div>
  );
};
