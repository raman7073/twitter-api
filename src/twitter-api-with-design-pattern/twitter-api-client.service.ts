import axios from 'axios';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as FormData from 'form-data';

@Injectable()
export class TwitterApiClient {
    async post(url: string, data: FormData, headers: any): Promise<any> {
        try {
            const response = await axios.post(url, data, { headers: { ...data.getHeaders(), ...headers } });
            return response.data;
        } catch (error) {
            throw new InternalServerErrorException('Twitter API POST request failed');
        }
    }

    async get(url: string, headers: any): Promise<any> {
        try {
            const response = await axios.get(url, { headers });
            return response.data;
        } catch (error) {
            throw new InternalServerErrorException('Twitter API GET request failed');
        }
    }

    async postTweet(url: string, data: any, headers: any): Promise<any> {
        try {
            const response = await axios.post(url, data, { headers });
            return response.data;
        } catch (error) {
            throw new InternalServerErrorException('Twitter API POST request failed');
        }
    }
}
