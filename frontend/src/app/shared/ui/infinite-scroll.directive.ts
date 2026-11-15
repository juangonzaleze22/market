import { Directive, HostListener, input, output } from '@angular/core';

@Directive({
  selector: '[appInfiniteScroll]',
})
export class InfiniteScrollDirective {
  readonly appInfiniteScroll = input(true);
  readonly scrollOffset = input(120);
  readonly load = output<void>();

  private lastEmit = 0;

  @HostListener('scroll', ['$event'])
  onScroll(event: Event): void {
    if (!this.appInfiniteScroll()) return;

    const target = event.target as HTMLElement | null;
    if (!target) return;

    const remaining =
      target.scrollHeight - target.scrollTop - target.clientHeight;
    if (remaining > this.scrollOffset()) return;

    const now = Date.now();
    if (now - this.lastEmit < 150) return;
    this.lastEmit = now;

    this.load.emit();
  }
}
