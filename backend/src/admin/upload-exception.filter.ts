import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { MulterError } from 'multer';
import { MAX_UPLOAD_SIZE } from './upload.constants.js';

@Catch(MulterError)
export class UploadExceptionFilter implements ExceptionFilter<MulterError> {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse();
    const req = ctx.getRequest();

    const message =
      exception.code === 'LIMIT_FILE_SIZE'
        ? `La imagen no puede superar los ${MAX_UPLOAD_SIZE / 1024 / 1024}MB`
        : `Error al subir el archivo: ${exception.message}`;

    const status = new BadRequestException(message).getStatus();

    res.status(status).json({
      statusCode: status,
      message,
      error: 'Bad Request',
      path: req?.url,
    });
  }
}
