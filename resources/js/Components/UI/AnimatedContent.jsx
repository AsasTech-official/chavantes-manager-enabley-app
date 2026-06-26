import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Baseado em https://github.com/DavidHDev/react-bits (AnimatedContent) + `playOnMount` para ecrãs sem scroll.
 * @see https://reactbits.dev/animations/animated-content
 */
export default function AnimatedContent({
    children,
    container,
    distance = 100,
    direction = 'vertical',
    reverse = false,
    duration = 0.8,
    ease = 'power3.out',
    initialOpacity = 0,
    animateOpacity = true,
    scale = 1,
    threshold = 0.1,
    delay = 0,
    /** No login (sem altura de scroll) usa isto em vez de ScrollTrigger. */
    playOnMount = false,
    disappearAfter = 0,
    disappearDuration = 0.5,
    disappearEase = 'power3.in',
    onComplete,
    onDisappearanceComplete,
    className = '',
    ...props
}) {
    const ref = useRef(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        const axis = direction === 'horizontal' ? 'x' : 'y';
        const offset = reverse ? -distance : distance;
        const startPct = (1 - threshold) * 100;

        gsap.set(el, {
            [axis]: offset,
            scale,
            opacity: animateOpacity ? initialOpacity : 1,
            visibility: 'visible',
        });

        const runDisappear = () => {
            if (disappearAfter > 0) {
                gsap.to(el, {
                    [axis]: reverse ? distance : -distance,
                    scale: 0.8,
                    opacity: animateOpacity ? initialOpacity : 0,
                    delay: disappearAfter,
                    duration: disappearDuration,
                    ease: disappearEase,
                    onComplete: () => onDisappearanceComplete?.(),
                });
            }
        };

        const timelineComplete = () => {
            onComplete?.();
            runDisappear();
        };

        if (playOnMount) {
            const tl = gsap.timeline({ delay, onComplete: timelineComplete });
            tl.to(el, {
                [axis]: 0,
                scale: 1,
                opacity: 1,
                duration,
                ease,
            });
            return () => {
                tl.kill();
            };
        }

        const tl = gsap.timeline({ paused: true, delay, onComplete: timelineComplete });
        tl.to(el, {
            [axis]: 0,
            scale: 1,
            opacity: 1,
            duration,
            ease,
        });

        let scrollerTarget = container || document.getElementById('snap-main-container') || null;
        if (typeof scrollerTarget === 'string') {
            scrollerTarget = document.querySelector(scrollerTarget);
        }

        const st = ScrollTrigger.create({
            trigger: el,
            ...(scrollerTarget ? { scroller: scrollerTarget } : {}),
            start: `top ${startPct}%`,
            once: true,
            onEnter: () => {
                tl.play(0);
            },
        });
        requestAnimationFrame(() => {
            ScrollTrigger.refresh();
        });

        return () => {
            st.kill();
            tl.kill();
        };
    }, [
        container,
        distance,
        direction,
        reverse,
        duration,
        ease,
        initialOpacity,
        animateOpacity,
        scale,
        threshold,
        delay,
        playOnMount,
        disappearAfter,
        disappearDuration,
        disappearEase,
        onComplete,
        onDisappearanceComplete,
    ]);

    return (
        <div ref={ref} className={className} style={{ visibility: 'hidden' }} {...props}>
            {children}
        </div>
    );
}
