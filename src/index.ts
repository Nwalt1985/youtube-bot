import { S3 } from 'aws-sdk';

import { metadata } from './metadata';
import { Readable } from 'stream';
import { generateNewToken, getStoredTokens } from './token.helper';
import { uploadToYoutube } from './upload';

const s3 = new S3();

const BUCKET_NAME = 'youtube-shorts';

exports.handler = async () => {
	const { accessToken, refreshToken } = await getStoredTokens();

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

	try {
		console.log('Uploading. First try...');

		const youtubeWithNewCredentials = await generateNewToken(refreshToken);

		const response = await uploadToYoutube(videoIndex, youtubeWithNewCredentials, videoStream);

		console.log('Success.', JSON.stringify(response, null, 2));
		
    } catch (error: any) {
        
        if (error.code === 401 || (error.message && error.message.includes('invalid_grant'))) {
            console.log('401: Access token expired or refresh token is invalid. Manual re-authorization required.');
    
            return { message: 'Manual re-authorization required.' };
        } else {
			console.log('Uploading. Second try...');
            const youtubeWithNewCredentials = await generateNewToken(refreshToken);

			const response = await uploadToYoutube(videoIndex, youtubeWithNewCredentials, videoStream);

			console.log('Success.', JSON.stringify(response, null, 2))
            throw error;
        }
    }

	await s3.deleteObject({
		Bucket: BUCKET_NAME,
		Key: videoKey!
	}).promise();

	console.log('Video short uploaded to Youtube and deleted from S3')

    return { message: 'Video short uploaded to Youtube and deleted from S3' };
};


