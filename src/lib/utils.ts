import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAbsoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  
  let base = "";
  
  // 0. Try window.__BACKEND_URL__ injected dynamically by our custom template router
  try {
    const injectedUrl = (window as any).__BACKEND_URL__;
    if (injectedUrl && (injectedUrl.startsWith("http://") || injectedUrl.startsWith("https://"))) {
      base = new URL(injectedUrl).origin;
    }
  } catch (e) {
    // Ignore error
  }
  
  // 1. Try process.env.APP_URL or import.meta.env.VITE_APP_URL if defined (compiled at build time or injected)
  try {
    const envUrl = (process.env as any).APP_URL || (import.meta as any).env?.VITE_APP_URL || (import.meta as any).env?.APP_URL;
    if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
      base = new URL(envUrl).origin;
    }
  } catch (e) {
    // Ignore error
  }

  // 2. Try to get the origin of the current module file (Vite/ESM)
  if (!base) {
    try {
      const moduleUrl = import.meta.url;
      if (moduleUrl && (moduleUrl.startsWith("http://") || moduleUrl.startsWith("https://"))) {
        base = new URL(moduleUrl).origin;
      }
    } catch (e) {
      // Ignore error
    }
  }

  // 3. Fallback: Try to look up scripts or stylesheet URLs in the document
  if (!base) {
    try {
      const scriptUrls = Array.from(document.querySelectorAll("script"))
        .map(s => s.src)
        .filter(src => src && (src.startsWith("http://") || src.startsWith("https://")));
      if (scriptUrls.length > 0) {
        base = new URL(scriptUrls[0]).origin;
      }
    } catch (e) {
      // Ignore error
    }
  }

  // 3.5 Try document.baseURI and base element href
  if (!base) {
    try {
      const baseUri = document.baseURI;
      if (baseUri && (baseUri.startsWith("http://") || baseUri.startsWith("https://"))) {
        base = new URL(baseUri).origin;
      }
      if (!base) {
        const baseEl = document.querySelector("base");
        const baseHref = baseEl?.getAttribute("href");
        if (baseHref && (baseHref.startsWith("http://") || baseHref.startsWith("https://"))) {
          base = new URL(baseHref).origin;
        }
      }
    } catch (e) {
      // Ignore error
    }
  }

  // 4. Try window.location.origin
  if (!base) {
    try {
      const origin = window.location.origin;
      if (origin && origin !== "null" && origin !== "about:srcdoc" && !origin.startsWith("about:")) {
        base = origin;
      }
    } catch (e) {
      // Ignore error
    }
  }

  // 5. Try to extract origin from any HTML elements that might have absolute URLs
  if (!base) {
    try {
      const elements = Array.from(document.querySelectorAll("[src], [href]"));
      for (const el of elements) {
        const urlStr = el.getAttribute("src") || el.getAttribute("href");
        if (urlStr && (urlStr.startsWith("http://") || urlStr.startsWith("https://"))) {
          if (!urlStr.includes("fonts.googleapis.com") && !urlStr.includes("gstatic.com") && !urlStr.includes("youtube.com") && !urlStr.includes("ytimg.com")) {
            base = new URL(urlStr).origin;
            break;
          }
        }
      }
      
      // Secondary loop if nothing specific found
      if (!base) {
        for (const el of elements) {
          const urlStr = el.getAttribute("src") || el.getAttribute("href");
          if (urlStr && (urlStr.startsWith("http://") || urlStr.startsWith("https://"))) {
            base = new URL(urlStr).origin;
            break;
          }
        }
      }
    } catch (e) {
      // Ignore error
    }
  }

  // 6. Try window.parent.location/window.top.location if not cross-origin blocked
  if (!base) {
    try {
      if (window.parent && window.parent.location) {
        const parentHref = window.parent.location.href;
        if (parentHref && (parentHref.startsWith("http://") || parentHref.startsWith("https://"))) {
          base = new URL(parentHref).origin;
        }
      }
    } catch (e) {
      // Ignore error
    }
  }

  // 7. Try standard window.location.href if it is HTTP/HTTPS
  if (!base) {
    try {
      const href = window.location.href;
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        base = new URL(href).origin;
      }
    } catch (e) {
      // Ignore error
    }
  }

  // 8. Try window.location.ancestorOrigins
  if (!base) {
    try {
      const ancestorOrigins = (window.location as any).ancestorOrigins;
      if (ancestorOrigins && ancestorOrigins.length > 0) {
        const ancestor = ancestorOrigins[0];
        if (ancestor && (ancestor.startsWith("http://") || ancestor.startsWith("https://"))) {
          base = ancestor;
        }
      }
    } catch (e) {
      // Ignore error
    }
  }

  // If we still can't find anything, just return the path as relative
  if (!base) {
    return path;
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

export function parseVNDAmount(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (typeof val !== 'string') return 0;

  const str = val.trim();
  if (!str) return 0;

  // Clean currency symbols, 'đ', 'VND', spaces
  let cleaned = str.replace(/[đĐ$VNDvnd\s]/g, '');

  // Handle signs
  let isNegative = false;
  if (cleaned.startsWith('-')) {
    isNegative = true;
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  const dotCount = (cleaned.match(/\./g) || []).length;
  const commaCount = (cleaned.match(/,/g) || []).length;

  if (dotCount > 0 && commaCount > 0) {
    const dotIdx = cleaned.indexOf('.');
    const commaIdx = cleaned.indexOf(',');
    if (dotIdx < commaIdx) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (dotCount > 1) {
    cleaned = cleaned.replace(/\./g, '');
  } else if (commaCount > 1) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (dotCount === 1 && commaCount === 0) {
    const parts = cleaned.split('.');
    if (parts[1] && (parts[1].length === 3 || (parts[1].length > 3 && parts[1].length % 3 === 0))) {
      cleaned = cleaned.replace('.', '');
    }
  } else if (commaCount === 1 && dotCount === 0) {
    const parts = cleaned.split(',');
    if (parts[1] && (parts[1].length === 3 || (parts[1].length > 3 && parts[1].length % 3 === 0))) {
      cleaned = cleaned.replace(',', '');
    } else if (parts[1] && parts[1].length <= 2) {
      cleaned = parts[0] + '.' + parts[1];
    }
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return isNegative ? -num : num;
}

