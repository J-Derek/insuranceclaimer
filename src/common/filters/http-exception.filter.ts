import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(HttpExceptionFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const requestId = (request as any).requestId || uuidv4();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'INTERNAL_SERVER_ERROR';
        let details: any[] | undefined;

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'string') {
                message = exceptionResponse;
            } else if (typeof exceptionResponse === 'object') {
                const resp = exceptionResponse as any;
                message = resp.message || message;
                error = resp.error || error;

                if (Array.isArray(resp.message)) {
                    details = resp.message.map((msg: string) => ({
                        message: msg,
                    }));
                    message = 'Validation failed';
                }
            }

            error = HttpStatus[status] || error;
        } else {
            this.logger.error(
                `Unhandled exception: ${exception}`,
                exception instanceof Error ? exception.stack : undefined,
            );
        }

        response.status(status).json({
            statusCode: status,
            error,
            message,
            details,
            requestId,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
