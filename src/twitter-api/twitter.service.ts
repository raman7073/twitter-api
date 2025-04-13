import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as FormData from 'form-data';
import axios from 'axios';
import * as crypto from 'crypto';
import OAuth from 'oauth-1.0a';
import { ConfigService } from '@nestjs/config';

/**
 * TwitterService handles video uploads to Twitter using chunked uploads.
 * This service supports videos larger than 5MB and up to 512MB.
 */
@Injectable()
export class TwitterService {
    private readonly CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunk size

    private readonly apiKey: string;
    private readonly apiSecret: string;
    private readonly accessTokenTwitter: string;
    private readonly accessTokenSecret: string;

    constructor(private readonly configService: ConfigService) {
        // Load Twitter API credentials from environment or configuration
        this.apiKey = this.configService.get<string>('TWITTER_API_KEY');
        this.apiSecret = this.configService.get<string>('TWITTER_API_SECRET');
        this.accessTokenTwitter = this.configService.get<string>('TWITTER_ACCESS_TOKEN');
        this.accessTokenSecret = this.configService.get<string>('TWITTER_ACCESS_TOKEN_SECRET');
    }

    /**
     * Step 0: Get the Twitter user ID using the access token obtained via OAuth 2.0.
     * @param accessToken OAuth 2.0 access token
     * @returns Twitter user ID
     */
    async getTwitterUserId(accessToken: string): Promise<string> {
        try {
            const response = await axios.get("https://api.x.com/2/users/me", {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            return response.data.data.id;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Step 1: Initialize OAuth with HMAC-SHA1 hashing for Twitter API authentication.
     * @returns OAuth instance
     */
    private getOAuth() {
        return new OAuth({
            consumer: {
                key: this.apiKey,
                secret: this.apiSecret,
            },
            signature_method: 'HMAC-SHA1',
            hash_function: (baseString, key) =>
                crypto.createHmac('sha1', key).update(baseString).digest('base64'),
        });
    }

    /**
     * Step 2: Initialize the media upload session on Twitter.
     * @param videoBuffer Video file buffer
     * @param fileName Name of the video file
     * @param contentType MIME type of the video
     * @param userId Twitter user ID
     * @returns Media ID for the upload session
     */
    private async initializeUpload(
        videoBuffer: Buffer,
        fileName: string,
        contentType: string,
        userId: string,
    ): Promise<string> {
        const bufferLength = videoBuffer.length;
        const data = new FormData();
        data.append('media_category', 'amplify_video');
        data.append('total_bytes', bufferLength);
        data.append('media_type', 'video/mp4');
        data.append('media', videoBuffer, { filename: fileName, contentType });
        data.append('command', 'INIT');
        data.append('additional_owners', userId);

        const url = 'https://upload.twitter.com/1.1/media/upload.json';
        const oauth = this.getOAuth();
        const authHeader = oauth.toHeader(
            oauth.authorize({ url, method: 'POST' }, { key: this.accessTokenTwitter, secret: this.accessTokenSecret }),
        );

        try {
            const response = await axios.post(url, data, {
                headers: {
                    ...data.getHeaders(),
                    Authorization: authHeader['Authorization'],
                },
            });
            return response.data.media_id_string;
        } catch (error) {
            throw new InternalServerErrorException('Twitter INIT upload failed');
        }
    }

    /**
     * Step 3: Append a chunk of the video to the media upload session.
     * @param mediaId Media ID of the upload session
     * @param chunkIndex Index of the current chunk
     * @param chunkData Buffer containing the chunk data
     */
    private async uploadMediaChunk(mediaId: string, chunkIndex: number, chunkData: Buffer): Promise<any> {
        const data = new FormData();
        data.append('media', chunkData, { filename: `chunk_${chunkIndex}.mp4` });
        data.append('media_id', mediaId);
        data.append('segment_index', chunkIndex);
        data.append('command', 'APPEND');
        data.append('media_category', 'amplify_video');

        const url = 'https://upload.twitter.com/1.1/media/upload.json';
        const oauth = this.getOAuth();
        const authHeader = oauth.toHeader(
            oauth.authorize({ url, method: 'POST' }, { key: this.accessTokenTwitter, secret: this.accessTokenSecret }),
        );

        try {
            const response = await axios.post(url, data, {
                headers: {
                    ...data.getHeaders(),
                    Authorization: authHeader['Authorization'],
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Step 4: Finalize the media upload session.
     * @param mediaId Media ID of the upload session
     * @returns Finalization response
     */
    private async finalizeUpload(mediaId: string): Promise<any> {
        const data = new FormData();
        data.append('media_id', mediaId);
        data.append('command', 'FINALIZE');

        const url = 'https://upload.twitter.com/1.1/media/upload.json';
        const oauth = this.getOAuth();
        const authHeader = oauth.toHeader(
            oauth.authorize({ url, method: 'POST' }, { key: this.accessTokenTwitter, secret: this.accessTokenSecret }),
        );

        try {
            const response = await axios.post(url, data, {
                headers: {
                    ...data.getHeaders(),
                    Authorization: authHeader['Authorization'],
                },
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Step 5: Check the media processing status on Twitter.
     * @param mediaId Media ID of the upload session
     * @returns Processing status information
     */
    private async checkMediaProcessingStatus(mediaId: string): Promise<any> {
        const url = `https://upload.twitter.com/1.1/media/upload.json?command=STATUS&media_id=${mediaId}`;
        const oauth = this.getOAuth();
        const authHeader = oauth.toHeader(
            oauth.authorize({ url, method: 'GET' }, { key: this.accessTokenTwitter, secret: this.accessTokenSecret }),
        );

        try {
            const response = await axios.get(url, {
                headers: {
                    Authorization: authHeader['Authorization'],
                },
            });
            return response.data.processing_info;
        } catch (error) {
            throw error;
        }
    }

    /**
     * Step 6: Poll the media processing status until it is ready or fails.
     * @param mediaId Media ID of the upload session
     * @param delay Delay between polling attempts in milliseconds
     * @returns True if processing succeeded, false otherwise
     */
    private async pollMediaProcessingStatus(mediaId: string, delay: number): Promise<boolean> {
        let mediaState = 'pending';
        let attempts = 0;
        const maxAttempts = 30;

        while (mediaState !== 'succeeded' && attempts < maxAttempts) {
            const status = await this.checkMediaProcessingStatus(mediaId);
            mediaState = status?.state;

            if (mediaState === 'succeeded') {
                return true;
            }

            if (mediaState === 'failed') {
                return false;
            }

            attempts++;
            await new Promise(resolve => setTimeout(resolve, delay));
        }
        return false;
    }

    /**
     * Upload a video to Twitter using chunked uploads.
     * @param videoBuffer Video file buffer
     * @param fileName Name of the video file
     * @param contentType MIME type of the video
     * @param accessToken OAuth 2.0 access token
     * @returns Media ID or error message
     */
    async uploadVideoToTwitter(
        videoBuffer: Buffer,
        fileName: string,
        contentType: string,
        accessToken: string,
    ): Promise<string> {
        try {
            // Step 0: Get user ID using the provided access token
            const userId = await this.getTwitterUserId(accessToken);

            // Step 1: Initialize the upload session
            const mediaId = await this.initializeUpload(videoBuffer, fileName, contentType, userId);

            // Step 2: Upload video chunks
            let chunkIndex = 0;
            for (let i = 0; i < videoBuffer.length; i += this.CHUNK_SIZE) {
                const chunkData = videoBuffer.subarray(i, i + this.CHUNK_SIZE);
                await this.uploadMediaChunk(mediaId, chunkIndex, chunkData);
                chunkIndex++;
            }

            // Step 3: Finalize the upload session
            const finalizeResponse = await this.finalizeUpload(mediaId);

            // Step 4: Poll for media processing status
            const pollStatus = await this.pollMediaProcessingStatus(
                finalizeResponse.media_id_string,
                (finalizeResponse.processing_info?.check_after_secs || 5) * 1000,
            );

            if (pollStatus) return finalizeResponse.media_id_string;
            throw new InternalServerErrorException('Media processing failed');

        } catch (error) {
            throw new InternalServerErrorException('Upload failed');
        }
    }

    /**
     * Post a tweet with the uploaded video.
     * @param videoBuffer Video file buffer
     * @param fileName Name of the video file
     * @param contentType MIME type of the video
     * @param accessToken OAuth 2.0 access token
     * @param text Optional tweet text
     * @returns Tweet response data
     */

    async postTweet(
        videoBuffer: Buffer,
        fileName: string,
        contentType: string,
        accessToken: string,
        text?: string
    ): Promise<any> {
        try {

            const mediaId = await this.uploadVideoToTwitter(videoBuffer, fileName, contentType, accessToken);
            const tweetPayload = {
                text: text || 'Check out this cool content!',
                media: {
                    media_ids: [mediaId],
                },
            };

            const tweetResponse = await axios.post('https://api.x.com/2/tweets', tweetPayload, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            return tweetResponse.data;
        } catch (error) {
            throw error;
        }
    }
}


