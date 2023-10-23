import { metadata } from './metadata';

export async function uploadToYoutube(index: number, youtube: any, videoStream: any, thumbnailStream: any): Promise<any> {
	if (videoStream._readableState.ended) {
		throw new Error('videoStream has already ended and cannot be used.');
	}

	if (thumbnailStream._readableState.ended) {
		throw new Error('thumbnailStream has already ended and cannot be used.');
	}

	const { title, tags, description } = metadata.find((video) => video.id === index)!;

	const videoResponse =  await youtube.videos.insert({
		part: 'id,snippet,status',
		requestBody: {
			snippet: {
				title,
				description,
				tags
			},
			status: {
				privacyStatus: 'public',
			}
		},
		media: {
			mimeType: 'video/*',
			body: videoStream,
		}
	});

	const videoId = videoResponse.data.id;

	console.log(`Setting custom thumbnail for video ID: ${videoId}`);

    const thumbResponse = await youtube.thumbnails.set({
        videoId: videoId,
        media: {
            mimeType: 'image/png',
            body: thumbnailStream
        }
    });

	return {
		videoResponse,
		thumbResponse
	}
}