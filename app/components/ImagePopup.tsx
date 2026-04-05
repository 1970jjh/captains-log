'use client';

import React, { useEffect } from 'react';

interface ImagePopupProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export default function ImagePopup({ src, alt, onClose }: ImagePopupProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="nb-btn fixed top-6 right-6 w-12 h-12 flex items-center justify-center bg-cl-red text-white text-2xl z-[10000] !rounded-full !p-0"
      >
        &times;
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[90vh] object-contain rounded-xl border-3 border-cl-border shadow-[6px_6px_0px_#1A1A1A]"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
