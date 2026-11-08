import { Component, input, output, signal } from '@angular/core';
import { ImageCropperComponent, ImageCroppedEvent } from 'ngx-image-cropper';
import { ModalComponent } from './modal';

@Component({
  selector: 'app-image-cropper-modal',
  imports: [ModalComponent, ImageCropperComponent],
  styles: [
    `
      .crop-stage {
        background: var(--color-canvas-softer);
        border: 1px solid var(--color-surface-pressed);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        max-height: 60vh;
        overflow: auto;
      }
      .tool-btn {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--color-surface-pressed);
        background: var(--color-canvas);
        color: var(--color-ink);
        transition: background 0.15s ease;
      }
      .tool-btn:hover:not(:disabled) {
        background: var(--color-canvas-soft);
      }
      .tool-btn:disabled {
        opacity: 0.35;
        cursor: not-allowed;
      }
      .tool-btn.active {
        background: var(--color-primary);
        color: var(--color-on-primary);
        border-color: var(--color-primary);
      }
    `,
  ],
  template: `
    <app-modal
      [open]="open()"
      [title]="title()"
      size="lg"
      [testId]="testId()"
      [closeOnBackdrop]="false"
      (closed)="onCancel()"
    >
      <div class="crop-stage">
        @if (file(); as f) {
          <image-cropper
            [imageFile]="f"
            output="blob"
            [format]="format()"
            [imageQuality]="quality()"
            [aspectRatio]="aspectRatio()"
            [maintainAspectRatio]="maintainAspectRatio()"
            [resizeToWidth]="resizeToWidth()"
            [canvasRotation]="rotation()"
            [alignImage]="'center'"
            [containWithinAspectRatio]="true"
            [allowMoveImage]="moveFlag()"
            [cropperMinWidth]="80"
            (imageCropped)="onCropped($event)"
            (cropperReady)="onReady()"
            (loadImageFailed)="onLoadFailed()"
          />
        }
      </div>

      @if (loadError()) {
        <p class="mt-md text-body-sm text-red-600" [attr.data-testid]="testId() + '-error'">
          No se pudo cargar la imagen. Verifica que el archivo sea una imagen valida.
        </p>
      }

      <div class="mt-lg flex items-center gap-sm">
        <button
          type="button"
          class="tool-btn"
          (click)="rotateLeft()"
          [disabled]="!ready()"
          [attr.aria-label]="'Rotar a la izquierda'"
          [attr.data-testid]="testId() + '-rotate-left'"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
            <path
              fill-rule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V3.537a.75.75 0 0 0-1.5 0v2.033a7 7 0 0 0-11.712 3.138.75.75 0 0 0 1.449.39 5.5 5.5 0 0 1 9.201-2.466l.312.311h-2.433a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .53-.219Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <button
          type="button"
          class="tool-btn"
          (click)="rotateRight()"
          [disabled]="!ready()"
          [attr.aria-label]="'Rotar a la derecha'"
          [attr.data-testid]="testId() + '-rotate-right'"
        >
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            class="w-4 h-4"
            style="transform: scaleX(-1)"
          >
            <path
              fill-rule="evenodd"
              d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H4.598a.75.75 0 0 0-.75.75v3.634a.75.75 0 0 0 1.5 0v-2.033a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V3.537a.75.75 0 0 0-1.5 0v2.033a7 7 0 0 0-11.712 3.138.75.75 0 0 0 1.449.39 5.5 5.5 0 0 1 9.201-2.466l.312.311h-2.433a.75.75 0 0 0 0 1.5h3.634a.75.75 0 0 0 .53-.219Z"
              clip-rule="evenodd"
            />
          </svg>
        </button>
        <button
          type="button"
          class="tool-btn"
          [class.active]="moveFlag()"
          (click)="toggleMove()"
          [disabled]="!ready()"
          [attr.aria-label]="'Mover imagen'"
          [attr.data-testid]="testId() + '-move'"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
            <path
              d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.061l1.06-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.06 1.06a.75.75 0 0 0 1.06 1.06l1.06-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.06ZM5.404 6.464a.75.75 0 0 0 1.06-1.06l-1.06-1.06a.75.75 0 1 0-1.06 1.06l1.06 1.06Z"
            />
          </svg>
        </button>
        <span class="ml-md text-body-sm text-body hidden sm:inline">
          Scroll para zoom, arrastra para recortar
        </span>
      </div>

      <div modalFooter>
        <button
          type="button"
          class="px-xl py-md rounded-pill text-body-sm border border-surface-pressed hover:bg-canvas-soft"
          (click)="onCancel()"
          [attr.data-testid]="testId() + '-cancel'"
        >
          Cancelar
        </button>
        <button
          type="button"
          class="btn-primary"
          (click)="onConfirm()"
          [disabled]="!croppedBlob() || uploading()"
          [attr.data-testid]="testId() + '-confirm'"
        >
          @if (uploading()) {
            <span class="inline-flex items-center gap-sm">
              <span
                class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
              ></span>
              Subiendo...
            </span>
          } @else {
            Recortar y subir
          }
        </button>
      </div>
    </app-modal>
  `,
})
export class ImageCropperModalComponent {
  readonly open = input(false);
  readonly file = input<File | null>(null);
  readonly title = input('Recortar imagen');
  readonly testId = input('image-cropper-modal');
  readonly aspectRatio = input(1);
  readonly maintainAspectRatio = input(true);
  readonly format = input<'png' | 'jpeg' | 'webp'>('webp');
  readonly quality = input(85);
  readonly resizeToWidth = input(1200);
  readonly uploading = input(false);

  readonly cancelled = output<void>();
  readonly confirmed = output<Blob>();

  protected readonly croppedBlob = signal<Blob | null>(null);
  protected readonly rotation = signal(0);
  protected readonly ready = signal(false);
  protected readonly loadError = signal(false);
  protected readonly moveFlag = signal(false);

  protected onCropped(event: ImageCroppedEvent): void {
    this.croppedBlob.set(event.blob ?? null);
  }

  protected onReady(): void {
    this.ready.set(true);
    this.loadError.set(false);
  }

  protected onLoadFailed(): void {
    this.loadError.set(true);
    this.ready.set(false);
    this.croppedBlob.set(null);
  }

  protected rotateLeft(): void {
    this.rotation.update((r) => r - 90);
  }

  protected rotateRight(): void {
    this.rotation.update((r) => r + 90);
  }

  protected toggleMove(): void {
    this.moveFlag.update((v) => !v);
  }

  protected onCancel(): void {
    this.reset();
    this.cancelled.emit();
  }

  protected onConfirm(): void {
    const blob = this.croppedBlob();
    if (!blob) return;
    this.confirmed.emit(blob);
  }

  private reset(): void {
    this.croppedBlob.set(null);
    this.rotation.set(0);
    this.ready.set(false);
    this.loadError.set(false);
    this.moveFlag.set(false);
  }
}
