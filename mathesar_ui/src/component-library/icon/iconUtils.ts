/** The radius of the dot relative to the smallest viewBox dimension */
const relativeDotSize = 0.22;
/** The radius of the dot cutout relative to the dot size */
const relativeDotCutout = 1.4;

interface Dot {
  /** Radius */
  r: number;
  /** X coordinate of the center */
  cx: number;
  /** Y coordinate of the center */
  cy: number;
}

export function getDot(viewBoxWidth: number, viewBoxHeight: number): Dot {
  const r = relativeDotSize * Math.min(viewBoxHeight, viewBoxWidth);
  return {
    r,
    cx: viewBoxWidth - r,
    cy: r,
  };
}

/**
 * This makes a clip path that covers the whole viewBox, except for a circle
 * centered on the dot and slightly larger than the dot. This clipping has the
 * effect of showing a negative-space border around the dot, which gives some
 * visual distinction between the dot and the icon regardless of the background
 * over which the icon is displayed.
 */
function getClipPathD(
  viewBoxWidth: number,
  viewBoxHeight: number,
  dot: Dot,
): string {
  const { cx, cy } = dot;
  const r = dot.r * relativeDotCutout;
  return [
    // Cover the viewport box
    'M 0 0',
    `L 0 ${viewBoxHeight}`,
    `L ${viewBoxWidth} ${viewBoxHeight}`,
    `L ${viewBoxWidth} 0`,
    'L 0 0',
    'z',

    // Cut out a circle centered on the dot
    `M ${cx} ${cy - r}`,
    `A ${r} ${r} 0 0 1 ${cx + r} ${cy}`,
    `A ${r} ${r} 0 0 1 ${cx} ${cy + r}`,
    `A ${r} ${r} 0 0 1 ${cx - r} ${cy}`,
    `A ${r} ${r} 0 0 1 ${cx} ${cy - r}`,
    'z',
  ].join(' ');
}

export function getPathStyle(
  viewBoxWidth: number,
  viewBoxHeight: number,
  dot: Dot | undefined,
): string | undefined {
  if (!dot) {
    return undefined;
  }
  const d = getClipPathD(viewBoxWidth, viewBoxHeight, dot);
  return `clip-path: path('${d}');`;
}
