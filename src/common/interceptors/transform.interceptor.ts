import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    meta?: any;
    requestId: string;
}

@Injectable()
export class TransformInterceptor<T>
    implements NestInterceptor<T, ApiResponse<T>> {
    intercept(
        context: ExecutionContext,
        next: CallHandler,
    ): Observable<ApiResponse<T>> {
        const request = context.switchToHttp().getRequest();
        const requestId = request.requestId || uuidv4();
        request.requestId = requestId;

        return next.handle().pipe(
            map((data) => {
                if (data && data._raw) return data._raw;

                const response: ApiResponse<T> = {
                    success: true,
                    data: data?.data !== undefined ? data.data : data,
                    requestId,
                };

                if (data?.meta) {
                    response.meta = data.meta;
                }

                return response;
            }),
        );
    }
}
