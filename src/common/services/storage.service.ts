import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private readonly client: Minio.Client;
    private readonly bucket: string;

    constructor(private configService: ConfigService) {
        const s3Config = this.configService.get('s3');
        this.bucket = s3Config.bucket;

        const endpointUrl = new URL(s3Config.endpoint);
        this.client = new Minio.Client({
            endPoint: endpointUrl.hostname,
            port: parseInt(endpointUrl.port) || (endpointUrl.protocol === 'https:' ? 443 : 80),
            useSSL: endpointUrl.protocol === 'https:',
            accessKey: s3Config.accessKey,
            secretKey: s3Config.secretKey,
        });

        this.ensureBucket();
    }

    private async ensureBucket(): Promise<void> {
        try {
            const exists = await this.client.bucketExists(this.bucket);
            if (!exists) {
                await this.client.makeBucket(this.bucket);
                this.logger.log(`Created bucket: ${this.bucket}`);
            }
        } catch (error) {
            this.logger.error(`Failed to ensure bucket: ${error}`);
        }
    }

    async upload(
        file: Buffer,
        originalName: string,
        mimeType: string,
    ): Promise<{ storageKey: string; size: number }> {
        const ext = originalName.split('.').pop() || 'bin';
        const storageKey = `documents/${uuidv4()}.${ext}`;

        await this.client.putObject(this.bucket, storageKey, file, file.length, {
            'Content-Type': mimeType,
            'x-amz-meta-original-name': originalName,
        });

        return { storageKey, size: file.length };
    }

    async getPresignedUrl(storageKey: string, expirySeconds = 3600): Promise<string> {
        return this.client.presignedGetObject(
            this.bucket,
            storageKey,
            expirySeconds,
        );
    }

    async download(storageKey: string): Promise<Buffer> {
        const stream = await this.client.getObject(this.bucket, storageKey);
        const chunks: Buffer[] = [];
        return new Promise((resolve, reject) => {
            stream.on('data', (chunk: Buffer) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }

    async delete(storageKey: string): Promise<void> {
        await this.client.removeObject(this.bucket, storageKey);
    }
}
