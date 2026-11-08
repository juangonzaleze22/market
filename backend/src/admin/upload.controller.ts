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
import { Roles } from '../common/decorators/roles.decorator.js';
import { UserRole } from '../database/entities/index.js';
import { createImageFileFilter } from '../common/upload/image-upload.js';
import { optimizeImageToWebp } from '../common/upload/image-optimizer.js';
import {
  buildUploadUrl,
  saveWebpImage,
} from '../common/upload/image-storage.js';
import { UploadExceptionFilter } from './upload-exception.filter.js';
import { MAX_UPLOAD_SIZE, resolveBucket } from './upload.constants.js';

const storage = memoryStorage();
const fileFilter = createImageFileFilter(resolveBucket);

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Roles(UserRole.ADMIN)
@UseFilters(new UploadExceptionFilter())
@Controller('admin/upload')
export class UploadController {
  @Post(':bucket')
  @ApiOperation({ summary: 'Subir imagen de producto o categoría (max 5MB)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      fileFilter,
      limits: { fileSize: MAX_UPLOAD_SIZE, files: 1 },
    }),
  )
  async upload(
    @Param('bucket') bucket: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const resolved = resolveBucket({ params: { bucket } });
    if (!resolved) {
      throw new BadRequestException('Carpeta de destino inválida');
    }
    if (!file?.buffer) {
      throw new BadRequestException(
        'No se recibió ningún archivo. El campo debe llamarse "file"',
      );
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
