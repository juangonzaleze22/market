import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class FlyToCartService {
  fly(source?: HTMLElement | null): void {
    if (!source || typeof document === 'undefined') return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const target = document.querySelector<HTMLElement>('[data-testid="cart-button"]');
    if (!target) return;

    const image = source instanceof HTMLImageElement ? source : source.querySelector('img');
    const startEl: HTMLElement = image ?? source;
    const start = startEl.getBoundingClientRect();
    const end = target.getBoundingClientRect();
    if (!start.width || !start.height || !end.width || !end.height) return;

    const size = Math.min(start.width, start.height, 160);
    const ghost = document.createElement(image ? 'img' : 'div');
    if (image) {
      (ghost as HTMLImageElement).src =
        (image as HTMLImageElement).currentSrc || image.src;
    }

    const style = ghost.style;
    style.position = 'fixed';
    style.left = `${start.left + start.width / 2 - size / 2}px`;
    style.top = `${start.top + start.height / 2 - size / 2}px`;
    style.width = `${size}px`;
    style.height = `${size}px`;
    style.objectFit = 'cover';
    style.borderRadius = image ? '16px' : '50%';
    if (!image) style.background = 'var(--color-primary)';
    style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.28)';
    style.zIndex = '10000';
    style.pointerEvents = 'none';
    style.willChange = 'transform, opacity';
    ghost.setAttribute('data-testid', 'fly-to-cart-ghost');
    document.body.appendChild(ghost);

    const dx = end.left + end.width / 2 - (start.left + start.width / 2);
    const dy = end.top + end.height / 2 - (start.top + start.height / 2);
    const endScale = Math.max(0.08, Math.min(end.width, end.height) / size);

    const animation = ghost.animate(
      [
        { transform: 'translate3d(0, 0, 0) scale(1)', opacity: 1, offset: 0 },
        {
          transform: `translate3d(${dx * 0.5}px, ${dy * 0.5 - 110}px, 0) scale(0.55)`,
          opacity: 0.98,
          offset: 0.55,
        },
        {
          transform: `translate3d(${dx}px, ${dy}px, 0) scale(${endScale})`,
          opacity: 0.35,
          offset: 1,
        },
      ],
      { duration: 850, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', fill: 'forwards' },
    );

    animation.onfinish = () => {
      ghost.remove();
      this.bump(target);
    };
    animation.oncancel = () => ghost.remove();
  }

  private bump(target: HTMLElement): void {
    target.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.35)' },
        { transform: 'scale(0.9)' },
        { transform: 'scale(1)' },
      ],
      { duration: 420, easing: 'ease-out' },
    );
  }
}
