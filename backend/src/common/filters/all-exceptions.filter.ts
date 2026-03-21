import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const messageResponse = exception instanceof HttpException
      ? exception.getResponse()
      : 'Внутренняя ошибка сервера';

    const message = typeof messageResponse === 'string'
      ? messageResponse
      : (messageResponse && typeof messageResponse === 'object' && 'message' in messageResponse
        ? (messageResponse as { message?: unknown }).message
        : messageResponse);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
