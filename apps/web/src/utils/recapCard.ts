'use client';

import type { WeeklyRecap, RecapAwards } from '@cooked/shared';

function safeText(input: string, max = 40): string {
  const s = (input || '').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function awardLine(awards: RecapAwards | undefined, key: keyof RecapAwards, fallback: string) {
  const v = awards?.[key];
  if (!v) return fallback;
  // RecapAwards is a union-ish set; we only need display_name here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyV = v as any;
  return typeof anyV.display_name === 'string' ? safeText(anyV.display_name, 28) : fallback;
}

export async function generateRecapCardPng(params: {
  recap: WeeklyRecap;
  groupName?: string | null;
}): Promise<Blob> {
  const { recap, groupName } = params;

  const width = 1200;
  const height = 630;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  // Theme colors (matches dark-mode-only vibe)
  const bg = '#0F0F0F';
  const surface = '#1A1A1A';
  const primary = '#FF4D00';
  const text = '#FFFFFF';
  const muted = '#A0A0A0';

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Card surface
  ctx.fillStyle = surface;
  roundRect(ctx, 40, 40, width - 80, height - 80, 28, true, false);

  // Header
  ctx.fillStyle = primary;
  ctx.font = 'bold 54px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText('Cooked', 90, 130);

  ctx.fillStyle = text;
  ctx.font = 'bold 44px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial';
  const title = groupName ? safeText(groupName, 26) : 'Weekly Recap';
  ctx.fillText(title, 90, 190);

  // Date range
  ctx.fillStyle = muted;
  ctx.font = '24px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText(`${recap.week_start} → ${recap.week_end}`, 90, 235);

  // Stats row
  const stats = recap.data?.stats;
  const statItems: Array<{ label: string; value: string }> = [
    { label: 'Completion', value: stats ? `${Math.round(stats.group_completion_rate)}%` : '—' },
    { label: 'Check-ins', value: stats ? `${stats.total_check_ins}` : '—' },
    { label: 'Folds', value: stats ? `${stats.total_folds}` : '—' },
    { label: 'Active pacts', value: stats ? `${stats.active_pacts}` : '—' },
  ];

  const startX = 90;
  const startY = 290;
  const boxW = 255;
  const boxH = 140;
  const gap = 18;

  for (let i = 0; i < statItems.length; i++) {
    const x = startX + i * (boxW + gap);
    const y = startY;
    ctx.fillStyle = '#242424';
    roundRect(ctx, x, y, boxW, boxH, 18, true, false);

    ctx.fillStyle = muted;
    ctx.font = '20px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(statItems[i].label, x + 22, y + 44);

    ctx.fillStyle = text;
    ctx.font = 'bold 44px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.fillText(statItems[i].value, x + 22, y + 102);
  }

  // Awards (simple “top lines”)
  const awards = recap.data?.awards;
  const awardLines: Array<{ emoji: string; label: string; value: string }> = [
    { emoji: '🏆', label: 'Most Consistent', value: awardLine(awards, 'most_consistent', 'No winner') },
    { emoji: '🤡', label: 'Biggest Fold', value: awardLine(awards, 'biggest_fold', 'No winner') },
    { emoji: '🔥', label: 'Comeback Player', value: awardLine(awards, 'comeback_player', 'No winner') },
    { emoji: '💀', label: 'Best Roast', value: awardLine(awards, 'best_roast', 'No winner') },
  ];

  const awardsX = 90;
  const awardsY = 495;
  ctx.fillStyle = text;
  ctx.font = 'bold 26px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial';
  ctx.fillText('Highlights', awardsX, awardsY);

  ctx.font = '22px Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial';
  for (let i = 0; i < awardLines.length; i++) {
    const lineY = awardsY + 44 + i * 34;
    ctx.fillStyle = muted;
    ctx.fillText(`${awardLines[i].emoji} ${awardLines[i].label}:`, awardsX, lineY);
    ctx.fillStyle = text;
    ctx.fillText(awardLines[i].value, awardsX + 300, lineY);
  }

  // Export
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (!b) return reject(new Error('Failed to render image'));
      resolve(b);
    }, 'image/png');
  });

  return blob;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: boolean,
  stroke: boolean
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}

