import * as crypto from 'crypto';
import OAuth from 'oauth-1.0a';
import { Injectable } from '@nestjs/common';

@Injectable()
export class OAuthService {
    constructor(private readonly apiKey: string, private readonly apiSecret: string) { }

    getOAuthInstance() {
        return new OAuth({
            consumer: { key: this.apiKey, secret: this.apiSecret },
            signature_method: 'HMAC-SHA1',
            hash_function: (baseString, key) =>
                crypto.createHmac('sha1', key).update(baseString).digest('base64'),
        });
    }

    getAuthHeader(url: string, method: string, token: { key: string, secret: string }) {
        const oauth = this.getOAuthInstance();
        return oauth.toHeader(oauth.authorize({ url, method }, token));
    }
}
