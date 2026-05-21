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
  try {
    // 1. Try to get the origin of the current module file (Vite/ESM)
    const moduleUrl = import.meta.url;
    if (moduleUrl && (moduleUrl.startsWith("http://") || moduleUrl.startsWith("https://"))) {
      base = new URL(moduleUrl).origin;
    }
  } catch (e) {
    // Ignore error
  }

  if (!base) {
    try {
      // 2. Fallback: Try to look up scripts or stylesheet URLs in the document
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

  if (!base) {
    try {
      // 3. Last fallback: Try window.location
      const origin = window.location.origin;
      if (origin && origin !== "null" && origin !== "about:srcdoc" && !origin.startsWith("about:")) {
        base = origin;
      } else {
        const urlObj = new URL(window.location.href);
        if (urlObj.protocol.startsWith("http")) {
          base = `${urlObj.protocol}//${urlObj.host}`;
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
