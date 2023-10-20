import { S3 } from 'aws-sdk';

import { metadata } from './metadata';
import { Readable } from 'stream';
import { generateNewToken, getStoredTokens } from './token.helper';
import { uploadToYoutube } from './upload';

const s3 = new S3();

const BUCKET_NAME = 'youtube-shorts';
const THUMBNAIL_BUCKET_NAME = 'youtube-video-thumbnails-brain-morsels';

exports.handler = async () => {
	const { accessToken } = await getStoredTokens();

    const s3Params = {
        Bucket: BUCKET_NAME,
        MaxKeys: 1
    };

    const s3Response = await s3.listObjectsV2(s3Params).promise();

    if (!s3Response.Contents || s3Response.Contents.length === 0) {
        return { message: 'No videos found in S3' };
    }

    const videoKey = s3Response.Contents[0].Key;
	const videoIndex = Number(videoKey?.replace('.mp4', ''))

	console.log(`Uploading video ${videoIndex} to Youtube...`);

    const s3Object = await s3.getObject({
        Bucket: BUCKET_NAME,
        Key: videoKey!
    }).promise();
    
	const videoBuffer = s3Object.Body as Buffer;
	const videoStream = Readable.from(videoBuffer);

	const { title } = metadata.find((video) => video.id === videoIndex)!;

    const thumbnailFilename = title.toLowerCase().replace(/ /g, "-") + ".png";

    console.log(`Fetching thumbnail ${thumbnailFilename} from S3...`);

    const thumbnailObject = await s3.getObject({
        Bucket: THUMBNAIL_BUCKET_NAME,
        Key: thumbnailFilename
    }).promise();

    const thumbnailBuffer = thumbnailObject.Body as Buffer;
    const thumbnailStream = Readable.from(thumbnailBuffer);

	try {
		console.log('Uploading. First try...');

		const youtubeWithNewCredentials = await generateNewToken(accessToken);

		const response = await uploadToYoutube(videoIndex, youtubeWithNewCredentials, videoStream, thumbnailStream);

		console.log('Success.', JSON.stringify(response, null, 2));
		
    } catch (error: any) {
        if (error.code === 401) {
			console.log('401: Access token expired. Refreshing...');

			console.log('Uploading. Second try...');
            const youtubeWithNewCredentials = await generateNewToken(accessToken);

			const response = await uploadToYoutube(videoIndex, youtubeWithNewCredentials, videoStream, thumbnailStream);

			console.log('Success.', JSON.stringify(response, null, 2))
        } else {
            throw error;
        }
    }

	await s3.deleteObject({
		Bucket: BUCKET_NAME,
		Key: videoKey!
	}).promise();

	await s3.deleteObject({
        Bucket: THUMBNAIL_BUCKET_NAME,
        Key: thumbnailFilename
    }).promise();

	console.log('Video & thumbnail uploaded to Youtube and deleted from S3')

    return { message: 'Video & thumbnail uploaded to Youtube and deleted from S3' };
};


