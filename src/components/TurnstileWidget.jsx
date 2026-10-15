import React, { useEffect, useRef, useState } from 'react';

const TURNSTILE_SITE_KEY = '0x4AAAAAAFXzLOYUO6UCy54Q';

export default function TurnstileWidget({ onVerify, onExpire, onError }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // 1. Check if script is already present
    const SCRIPT_ID = 'cf-turnstile-script';
    let script = document.getElementById(SCRIPT_ID);

    const onScriptLoaded = () => {
      setIsLoaded(true);
    };

    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = onScriptLoaded;
      document.head.appendChild(script);
    } else if (window.turnstile) {
      setIsLoaded(true);
    } else {
      script.addEventListener('load', onScriptLoaded);
    }

    return () => {
      if (script) {
        script.removeEventListener('load', onScriptLoaded);
      }
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !containerRef.current || !window.turnstile) return;

    // Reset previous widget if any
    if (widgetIdRef.current !== null) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch (e) {}
    }

    try {
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        theme: 'dark',
        callback: (token) => {
          if (onVerify) onVerify(token);
        },
        'expired-callback': () => {
          if (onExpire) onExpire();
        },
        'error-callback': (err) => {
          console.error('Turnstile error:', err);
          if (onError) onError(err);
        }
      });
    } catch (e) {
      console.error('Failed to render Turnstile widget:', e);
    }

    return () => {
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [isLoaded]);

  return (
    <div className="w-full flex flex-col items-center justify-center my-3">
      <div ref={containerRef} className="min-h-[65px] flex items-center justify-center" />
      <span className="text-[10px] text-text-muted mt-1 flex items-center gap-1">
        🔒 محمي بواسطة Cloudflare Turnstile
      </span>
    </div>
  );
}
