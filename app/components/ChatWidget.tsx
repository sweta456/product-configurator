import { useEffect } from "react";

declare global {
  interface Window {
    Tawk_API: object;
    Tawk_LoadStart: Date;
  }
}

interface ChatWidgetProps {
  propertyId: string;
  widgetId: string;
}

export function ChatWidget({ propertyId, widgetId }: ChatWidgetProps) {
  useEffect(() => {
    if (!propertyId || !widgetId) return;

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [propertyId, widgetId]);

  return null;
}
