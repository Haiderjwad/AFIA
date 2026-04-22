const UNSUPPORTED_COLOR_RE = /(oklab|oklch|color-mix\(|lab\(|lch\()/i;

function hasUnsupportedColorSyntax(value: string | null | undefined) {
  if (!value) return false;
  return UNSUPPORTED_COLOR_RE.test(value);
}

function createCanvasColorResolver(doc: Document) {
  const cache = new Map<string, string>();
  const canvas = doc.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  return (value: string, fallback = '#000000') => {
    const key = value.trim();
    if (!key) return key;
    const cached = cache.get(key);
    if (cached) return cached;
    if (!ctx) {
      cache.set(key, fallback);
      return fallback;
    }

    try {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = key;
      const resolved = String(ctx.fillStyle);
      const safe = hasUnsupportedColorSyntax(resolved) ? fallback : resolved;
      cache.set(key, safe);
      return safe;
    } catch {
      cache.set(key, fallback);
      return fallback;
    }
  };
}

type CloneFixOptions = {
  exportId: string;
  attributeName?: string;
  fontFamily?: string;
  fallbackColor?: string;
};

/**
 * html2canvas@1.4.x fails on Tailwind v4 color syntax (oklch/oklab/color-mix).
 * This mutates the cloned DOM subtree (found by data attribute) to:
 * - inline-resolve unsupported colors into safe rgb/hex (via Canvas parsing)
 * - remove unsupported shadow/gradient/filter declarations
 */
export function patchClonedSubtreeForHtml2Canvas(clonedDoc: Document, opts: CloneFixOptions) {
  const {
    exportId,
    attributeName = 'data-export-capture',
    fontFamily = "'Cairo', sans-serif",
    fallbackColor = '#2D6A4F'
  } = opts;

  const root = clonedDoc.querySelector(`[${attributeName}="${exportId}"]`) as HTMLElement | null;
  const win = clonedDoc.defaultView;
  if (!root || !win) return;

  const resolveColor = createCanvasColorResolver(clonedDoc);
  const elements: Element[] = [root, ...Array.from(root.querySelectorAll('*'))];

  const colorProps: Array<{ css: string; fallback?: string }> = [
    { css: 'color' },
    { css: 'background-color', fallback: '#ffffff' },
    { css: 'border-top-color' },
    { css: 'border-right-color' },
    { css: 'border-bottom-color' },
    { css: 'border-left-color' },
    { css: 'outline-color' },
    { css: 'text-decoration-color' },
    { css: 'caret-color' },
    { css: 'fill' },
    { css: 'stroke' }
  ];

  for (const el of elements) {
    const computed = win.getComputedStyle(el);
    const style = (el as HTMLElement).style;
    if (style) {
      style.setProperty('font-family', fontFamily, 'important');
      style.setProperty('letter-spacing', 'normal', 'important');
    }

    for (const { css, fallback } of colorProps) {
      const value = computed.getPropertyValue(css);
      if (!hasUnsupportedColorSyntax(value)) continue;
      style?.setProperty(css, resolveColor(value, fallback ?? fallbackColor), 'important');
    }

    const boxShadow = computed.getPropertyValue('box-shadow');
    if (hasUnsupportedColorSyntax(boxShadow)) style?.setProperty('box-shadow', 'none', 'important');

    const textShadow = computed.getPropertyValue('text-shadow');
    if (hasUnsupportedColorSyntax(textShadow)) style?.setProperty('text-shadow', 'none', 'important');

    const backgroundImage = computed.getPropertyValue('background-image');
    if (hasUnsupportedColorSyntax(backgroundImage)) style?.setProperty('background-image', 'none', 'important');

    const filter = computed.getPropertyValue('filter');
    if (hasUnsupportedColorSyntax(filter)) style?.setProperty('filter', 'none', 'important');

    const backdropFilter = computed.getPropertyValue('backdrop-filter');
    if (hasUnsupportedColorSyntax(backdropFilter)) style?.setProperty('backdrop-filter', 'none', 'important');
  }
}

