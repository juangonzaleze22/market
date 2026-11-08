import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, defer, switchMap } from 'rxjs';
import { ApiService } from './api.service';

export type UserUploadBucket = 'receipts' | 'chat';

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

const COMPRESSION_PROFILES: Record<UserUploadBucket, { maxSize: number; quality: number }> = {
  receipts: { maxSize: 2000, quality: 0.9 },
  chat: { maxSize: 1600, quality: 0.85 },
};

@Injectable({
  providedIn: 'root',
})
export class UploadService {
  private readonly path = 'uploads';

  constructor(
    private http: HttpClient,
    private api: ApiService,
  ) {}

  uploadImage(bucket: UserUploadBucket, file: File): Observable<UploadResponse> {
    return defer(() => this.compressImage(bucket, file)).pipe(
      switchMap((prepared) => {
        const form = new FormData();
        form.append('file', prepared, prepared.name);

        return this.http.post<UploadResponse>(this.api.url(`${this.path}/${bucket}`), form);
      }),
    );
  }

  private async compressImage(bucket: UserUploadBucket, file: File): Promise<File> {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      return file;
    }

    const profile = COMPRESSION_PROFILES[bucket];

    try {
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, profile.maxSize / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const context = canvas.getContext('2d');
      if (!context) {
        bitmap.close();
        return file;
      }

      context.drawImage(bitmap, 0, 0, width, height);
      bitmap.close();

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/webp', profile.quality);
      });

      if (!blob || blob.type !== 'image/webp') return file;

      return new File([blob], `${file.name.replace(/\.[^.]+$/, '')}.webp`, {
        type: 'image/webp',
        lastModified: Date.now(),
      });
    } catch {
      return file;
    }
  }
}
