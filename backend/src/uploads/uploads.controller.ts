import {
  BadRequestException,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { createUploadFileFilter } from '../common/upload/image-upload.js';
import { optimizeImageToWebp } from '../common/upload/image-optimizer.js';
import {
  buildUploadUrl,
  saveRawUpload,
  saveWebpImage,
} from '../common/upload/image-storage.js';
import { MAX_CHAT_UPLOAD_SIZE } from '../common/upload/upload.constants.js';
import { UploadExceptionFilter } from '../admin/upload-exception.filter.js';
import {
  resolveUserAllowedMime,
  resolveUserBucket,
} from './uploads.constants.js';

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(new UploadExceptionFilter())
@Controller('uploads')
export class UploadsController {
  @Post(':bucket')
  @ApiOperation({
    summary: 'Subir archivo de usuario (comprobante o adjunto de chat)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter: createUploadFileFilter(
        resolveUserBucket,
        resolveUserAllowedMime,
        'Formato no permitido para este tipo de archivo',
      ),
      limits: { fileSize: MAX_CHAT_UPLOAD_SIZE, files: 1 },
    }),
  )
  async upload(
    @Param('bucket') bucket: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const resolved = resolveUserBucket({ params: { bucket } });
    if (!resolved) {
      throw new BadRequestException('Carpeta de destino inválida');
    }
    if (!file?.buffer) {
      throw new BadRequestException(
        'No se recibió ningún archivo. El campo debe llamarse "file"',
      );
    }

    if (file.mimetype === 'application/pdf') {
      const filename = await saveRawUpload(file.buffer, resolved, '.pdf');

      return {
        url: buildUploadUrl(resolved, filename),
        filename,
        size: file.size,
        mimeType: 'application/pdf',
      };
    }

    const optimized = await optimizeImageToWebp(file.buffer, resolved);
    const filename = await saveWebpImage(optimized.buffer, resolved);

    return {
      url: buildUploadUrl(resolved, filename),
      filename,
      size: optimized.size,
      mimeType: 'image/webp',
      width: optimized.width,
      height: optimized.height,
    };
  }
}
