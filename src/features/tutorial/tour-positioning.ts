export const TOUR_TARGET_GAP = 16;

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PanelSize {
  width: number;
  height: number;
}

export interface TourViewport {
  width: number;
  height: number;
  safeAreaTop: number;
  safeAreaBottom: number;
  horizontalMargin: number;
}

export interface TourPanelPlacement extends Rect {
  side: 'above' | 'below';
  needsScroll: boolean;
  scrollDelta: number;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(value, maximum));
}

export function rectanglesIntersect(first: Rect, second: Rect): boolean {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

export function expandRect(rect: Rect, gap: number): Rect {
  return {
    x: rect.x - gap,
    y: rect.y - gap,
    width: rect.width + gap * 2,
    height: rect.height + gap * 2,
  };
}

export function calculateTourPanelPlacement(
  target: Rect,
  panel: PanelSize,
  viewport: TourViewport,
  gap = TOUR_TARGET_GAP,
): TourPanelPlacement {
  const topBoundary = viewport.safeAreaTop;
  const bottomBoundary = viewport.height - viewport.safeAreaBottom;
  const spaceAbove = Math.max(0, target.y - topBoundary - gap);
  const spaceBelow = Math.max(
    0,
    bottomBoundary - (target.y + target.height) - gap,
  );
  const fitsAbove = panel.height <= spaceAbove;
  const fitsBelow = panel.height <= spaceBelow;
  const targetCenter = target.y + target.height / 2;
  const viewportCenter = (topBoundary + bottomBoundary) / 2;
  const targetFullyVisible =
    target.y >= topBoundary &&
    target.y + target.height <= bottomBoundary;

  let side: TourPanelPlacement['side'];
  if (fitsAbove && fitsBelow) {
    side = targetCenter <= viewportCenter ? 'below' : 'above';
  } else if (fitsBelow) {
    side = 'below';
  } else if (fitsAbove) {
    side = 'above';
  } else {
    side = spaceBelow >= spaceAbove ? 'below' : 'above';
  }

  const availableHeight = side === 'below' ? spaceBelow : spaceAbove;
  const height = Math.max(0, Math.min(panel.height, availableHeight));
  const maxWidth = Math.max(0, viewport.width - viewport.horizontalMargin * 2);
  const width = Math.min(panel.width, maxWidth);
  const maximumLeft = Math.max(
    viewport.horizontalMargin,
    viewport.width - width - viewport.horizontalMargin,
  );
  const x = clamp(
    target.x + target.width / 2 - width / 2,
    viewport.horizontalMargin,
    maximumLeft,
  );
  const rawY =
    side === 'below'
      ? target.y + target.height + gap
      : target.y - gap - height;
  const provisionalRect = {
    x,
    y: clamp(
      rawY,
      topBoundary,
      Math.max(topBoundary, bottomBoundary - height),
    ),
    width,
    height,
  };
  const intersectsTarget = rectanglesIntersect(
    provisionalRect,
    expandRect(target, gap),
  );
  const needsScroll =
    panel.height > availableHeight ||
    !targetFullyVisible ||
    intersectsTarget;
  const desiredTargetY =
    side === 'below'
      ? bottomBoundary - gap - panel.height - target.height
      : topBoundary + gap + panel.height;

  return {
    x,
    y: provisionalRect.y,
    width,
    height,
    side,
    needsScroll,
    scrollDelta: needsScroll ? target.y - desiredTargetY : 0,
  };
}
