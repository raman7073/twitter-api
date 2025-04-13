<p align="center">
  <a href="https://developer.twitter.com/" target="blank"><img src="https://abs.twimg.com/icons/apple-touch-icon-192x192.png" width="120" alt="Twitter API Logo" /></a>
</p>

<p align="center">A NestJS project utilizing the Twitter API to upload large videos in chunks and post them on X (formerly Twitter).</p>

<p align="center">
<a href="https://www.npmjs.com/" target="_blank"><img src="https://img.shields.io/npm/v/npm.svg" alt="NPM Version" /></a>
<a href="https://opensource.org/licenses/MIT" target="_blank"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" /></a>
<a href="https://twitter.com" target="_blank"><img src="https://img.shields.io/twitter/follow/twitterapi.svg?style=social&label=Follow" alt="Follow Twitter API"></a>
</p>

## Description

This project leverages the Twitter API within a NestJS framework to enable uploading large video files in chunks and posting them on X. It simplifies the process of handling video uploads by breaking them into manageable parts and ensuring compliance with Twitter's media upload requirements.

## Features

- Upload large video files in chunks.
- Post videos directly to X with captions.
- Handle Twitter API authentication and rate limits.

## Project setup

```bash
$ npm install
```

## Usage

1. Set up your Twitter Developer account and create an app to obtain API keys.
2. Configure your environment variables with the required credentials:
   - `API_KEY`
   - `API_SECRET_KEY`
   - `ACCESS_TOKEN`
   - `ACCESS_TOKEN_SECRET`
3. Run the application:

```bash
$ npm run start
```

## Example

```typescript
import { TwitterService } from './twitter/twitter.service';

async function main() {
  const twitterService = new TwitterService();
  const videoPath = './path-to-your-video.mp4';
  const caption = 'Check out this amazing video!';

  try {
    const mediaId = await twitterService.uploadVideo(videoPath);
    await twitterService.postTweet(caption, mediaId);
    console.log('Video posted successfully!');
  } catch (error) {
    console.error('Error posting video:', error);
  }
}

main();
```

## Resources

- [Twitter API Documentation](https://developer.twitter.com/en/docs)
- [Twitter Developer Portal](https://developer.twitter.com/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Node.js Documentation](https://nodejs.org/en/docs/)

## Support

This project is open source and licensed under the [MIT License](https://opensource.org/licenses/MIT). Contributions are welcome!

## Stay in touch

- Author - [Raman Mehta](https://github.com/raman70737)

## License

This project is [MIT licensed](https://opensource.org/licenses/MIT).
