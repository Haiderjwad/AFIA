// Enhanced regex to catch all modern CSS color formats that html2canvas doesn't support
const UNSUPPORTED_COLOR_RE = /(oklab|oklch|color-mix\(|lab\(|lch\(|hwb\(|color\()/i;

function hasUnsupportedColorSyntax(value: string | null | undefined) {
  if (!value) return false;
  const trimmed = value.trim();
  // Check for direct oklch/oklab color functions
  if (UNSUPPORTED_COLOR_RE.test(trimmed)) return true;
  // Also check for CSS variables that might contain these
  if (/var\(/.test(trimmed)) {
    // For now, assume CSS variables might contain unsupported colors
    return false; // Let canvas try to resolve them first
  }
  return false;
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

    // Early return for cached colors
    const cached = cache.get(key);
    if (cached) return cached;

    // If value already contains unsupported syntax, use fallback immediately
    if (hasUnsupportedColorSyntax(key)) {
      cache.set(key, fallback);
      return fallback;
    }

    if (!ctx) {
      cache.set(key, fallback);
      return fallback;
    }

    try {
      // Try to set the color using canvas context
      ctx.fillStyle = '#000000'; // Reset
      ctx.fillStyle = key;
      const resolved = String(ctx.fillStyle);

      // Double-check resolved color for unsupported syntax
      if (hasUnsupportedColorSyntax(resolved)) {
        cache.set(key, fallback);
        return fallback;
      }

      cache.set(key, resolved);
      return resolved;
    } catch (error) {
      // Color parsing failed, use fallback
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

  // Comprehensive list of color properties that might contain unsupported colors
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
    { css: 'stroke' },
    { css: 'column-rule-color' },
    { css: 'stop-color' },
    { css: 'flood-color' },
    { css: 'lighting-color' }
  ];

  // 1. First, inline all computed styles that might contribute to rendering
  // We do this BEFORE removing stylesheets so we can get accurate computations
  for (const el of elements) {
    try {
      const computed = win.getComputedStyle(el);
      const style = (el as HTMLElement).style;

      if (!style) continue;

      // Inline all color properties as safe RGB/Hex values
      for (const { css, fallback } of colorProps) {
        const value = computed.getPropertyValue(css);
        if (value) {
          // Always resolve colors to be safe for html2canvas
          const resolved = resolveColor(value, fallback ?? fallbackColor);
          style.setProperty(css, resolved, 'important');
        }
      }

      // Inline layout critical styles (fonts)
      style.setProperty('font-family', fontFamily, 'important');
      style.setProperty('letter-spacing', 'normal', 'important');

      // Handle SVG specifically
      if (el instanceof SVGElement) {
        const fill = el.getAttribute('fill');
        const stroke = el.getAttribute('stroke');
        if (hasUnsupportedColorSyntax(fill)) el.setAttribute('fill', fallbackColor);
        if (hasUnsupportedColorSyntax(stroke)) el.setAttribute('stroke', fallbackColor);
      }

      // Handle complex properties and potential modern CSS features
      const complexProps = [
        'box-shadow', 'text-shadow', 'background-image',
        'filter', 'backdrop-filter', 'mask-image', 'clip-path'
      ];

      for (const prop of complexProps) {
        const value = computed.getPropertyValue(prop);
        if (hasUnsupportedColorSyntax(value)) {
          style.setProperty(prop, 'none', 'important');
        }
      }
    } catch (error) {
      console.debug('Error processing element for html2canvas compatibility:', error);
    }
  }

  // 2. Now process/remove sources of modern CSS that cause html2canvas to crash
  // Process all <style> tags
  const styleTags = Array.from(clonedDoc.getElementsByTagName('style'));
  for (const styleTag of styleTags) {
    if (styleTag.textContent) {
      // Replace modern color functions with a safe fallback in the text content
      styleTag.textContent = styleTag.textContent.replace(
        /((oklab|oklch|color-mix|lab|lch|hwb|color)\([^)]+\))/gi,
        fallbackColor
      );
    }
  }

  // Remove ALL <link> stylesheets. This is the most aggressive but safest way to 
  // prevent html2canvas from trying to fetch/parse external CSS that might contain oklch.
  // Since we inlined the important styles in step 1, the rendering should stay stable.
  const linkTags = Array.from(clonedDoc.getElementsByTagName('link'));
  for (const link of linkTags) {
    if (link.rel === 'stylesheet') {
      link.remove();
    }
  }
}
