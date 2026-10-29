import { useEffect } from 'react';

// Same position:fixed + saved scrollY lock as App.jsx (mobile menu).
// iOS Safari ignores overflow:hidden on the body.
export function useBodyScrollLock(locked) {
    useEffect(() => {
        if (!locked || typeof window === 'undefined') return undefined;

        const html = document.documentElement;
        const body = document.body;
        const y = window.scrollY || html.scrollTop || 0;

        const prev = {
            htmlOverflow: html.style.overflow,
            bodyOverflow: body.style.overflow,
            htmlOverscroll: html.style.overscrollBehavior,
            bodyOverscroll: body.style.overscrollBehavior,
            bodyPosition: body.style.position,
            bodyTop: body.style.top,
            bodyLeft: body.style.left,
            bodyRight: body.style.right,
            bodyWidth: body.style.width,
        };

        html.style.overflow = 'hidden';
        body.style.overflow = 'hidden';
        html.style.overscrollBehavior = 'none';
        body.style.overscrollBehavior = 'none';
        body.style.position = 'fixed';
        body.style.top = `-${y}px`;
        body.style.left = '0';
        body.style.right = '0';
        body.style.width = '100%';

        return () => {
            html.style.overflow = prev.htmlOverflow;
            body.style.overflow = prev.bodyOverflow;
            html.style.overscrollBehavior = prev.htmlOverscroll;
            body.style.overscrollBehavior = prev.bodyOverscroll;
            body.style.position = prev.bodyPosition;
            body.style.top = prev.bodyTop;
            body.style.left = prev.bodyLeft;
            body.style.right = prev.bodyRight;
            body.style.width = prev.bodyWidth;
            window.scrollTo(0, y);
        };
    }, [locked]);
}
