import React from 'react';
import './flash.css';
import { useFlash } from './FlashContext';

export default function FlashBanner() {
  const ctx = useFlash();
  if (!ctx || !ctx.flash) return null;

  const { message, type } = ctx.flash;

  return (
    <div className={`flash-banner ${type}`} role="status" aria-live="polite">
      {message}
    </div>
  );
}
