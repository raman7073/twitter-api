import { Controller, Post, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TwitterService } from './twitter.service';

@Controller('twitter')
export class TwitterController {
    constructor(private readonly twitterService: TwitterService) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('media'))
    async uploadVideo(
        @UploadedFile() file: Express.Multer.File,
        @Body('userId') accessToken: string,
        @Body('caption') caption: string
    ) {
        return await this.twitterService.postTweet(file.buffer, file.originalname, file.mimetype, accessToken, caption);
    }
}
