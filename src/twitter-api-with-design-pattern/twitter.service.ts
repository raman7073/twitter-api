// twitter.service.ts
import { Injectable } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { TwitterApiClient } from './twitter-api-client.service';
import { TwitterUploaderService } from './twitter-uploader.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TwitterService {
    private readonly chunkSize = 5 * 1024 * 1024; // 5MB

    private readonly uploader: TwitterUploaderService;
    private readonly apiClient: TwitterApiClient;
    private readonly oauthService: OAuthService;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('TWITTER_API_KEY');
        const apiSecret = this.configService.get<string>('TWITTER_API_SECRET');
        const accessToken = this.configService.get<string>('TWITTER_ACCESS_TOKEN');
        const accessTokenSecret = this.configService.get<string>('TWITTER_ACCESS_TOKEN_SECRET');

        const oauthService = new OAuthService(apiKey, apiSecret);
        const twitterApiClient = new TwitterApiClient();

        this.uploader = new TwitterUploaderService(oauthService, twitterApiClient, accessToken, accessTokenSecret);
        this.apiClient = twitterApiClient;
        this.oauthService = oauthService;
    }

    async getTwitterUserId(accessToken: string): Promise<string> {
        const url = "https://api.x.com/2/users/me";
        const response = await this.apiClient.get(url, { Authorization: `Bearer ${accessToken}` });
        return response.data.id;
    }

    async uploadVideo(videoBuffer: Buffer, fileName: string, contentType: string, userId: string): Promise<any> {
        const mediaId = await this.uploader.initializeUpload(videoBuffer, fileName, contentType, userId);

        for (let i = 0; i < videoBuffer.length; i += this.chunkSize) {
            const chunk = videoBuffer.subarray(i, i + this.chunkSize);
            const chunkIndex = Math.floor(i / this.chunkSize);
            await this.uploader.appendUpload(mediaId, chunkIndex, chunk);
        }

        const finalization = await this.uploader.finalizeUpload(mediaId);
        return finalization;
    }
}
