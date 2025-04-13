import { Injectable } from '@nestjs/common';
import * as FormData from 'form-data';
import { OAuthService } from './oauth.service';
import { TwitterApiClient } from './twitter-api-client.service';

@Injectable()
export class TwitterUploaderService {
    private readonly uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';

    constructor(
        private readonly oauthService: OAuthService,
        private readonly twitterApiClient: TwitterApiClient,
        private readonly accessToken: string,
        private readonly accessTokenSecret: string,
    ) { }

    async initializeUpload(videoBuffer: Buffer, fileName: string, contentType: string, userId: string): Promise<string> {
        const data = new FormData();
        data.append('media_category', 'amplify_video');
        data.append('total_bytes', videoBuffer.length);
        data.append('media_type', contentType);
        data.append('media', videoBuffer, { filename: fileName, contentType });
        data.append('command', 'INIT');
        data.append('additional_owners', userId);

        const headers = this.oauthService.getAuthHeader(this.uploadUrl, 'POST', {
            key: this.accessToken,
            secret: this.accessTokenSecret,
        });

        const response = await this.twitterApiClient.post(this.uploadUrl, data, headers);
        return response.media_id_string;
    }

    async appendUpload(mediaId: string, chunkIndex: number, chunkData: Buffer): Promise<any> {
        const data = new FormData();
        data.append('media', chunkData, { filename: `chunk_${chunkIndex}.mp4` });
        data.append('media_id', mediaId);
        data.append('segment_index', chunkIndex);
        data.append('command', 'APPEND');
        data.append('media_category', 'amplify_video');

        const headers = this.oauthService.getAuthHeader(this.uploadUrl, 'POST', {
            key: this.accessToken,
            secret: this.accessTokenSecret,
        });

        return await this.twitterApiClient.post(this.uploadUrl, data, headers);
    }

    async finalizeUpload(mediaId: string): Promise<any> {
        const data = new FormData();
        data.append('media_id', mediaId);
        data.append('command', 'FINALIZE');

        const headers = this.oauthService.getAuthHeader(this.uploadUrl, 'POST', {
            key: this.accessToken,
            secret: this.accessTokenSecret,
        });

        return await this.twitterApiClient.post(this.uploadUrl, data, headers);
    }
}
