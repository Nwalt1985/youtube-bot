import { SecretsManager } from 'aws-sdk';
import { google } from 'googleapis';

const secretsManager = new SecretsManager();

const SECRET_NAME = 'youtube-tokens';

export async function getStoredTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    const data = await secretsManager.getSecretValue({ SecretId: SECRET_NAME }).promise();
    const secrets = JSON.parse(data.SecretString!);

    return {
        accessToken: secrets.accessToken,
        refreshToken: secrets.refreshToken
    };
}

export async function storeNewAccessToken(accessToken: string): Promise<void> {
    const currentSecrets = await getStoredTokens();
    const updatedSecrets = {
        ...currentSecrets,
        accessToken: accessToken
    };
    await secretsManager.putSecretValue({
        SecretId: SECRET_NAME,
        SecretString: JSON.stringify(updatedSecrets)
    }).promise();
}

export async function generateNewToken(refreshToken: string) {
	const oauth2Client = new google.auth.OAuth2(
		process.env.CLIENT_ID,
		process.env.CLIENT_SECRET,
	);

	oauth2Client.setCredentials({ refresh_token: refreshToken });

	const newTokens = await oauth2Client.refreshAccessToken();
	const newAccessToken = newTokens.credentials.access_token;
		
	await storeNewAccessToken(newAccessToken as string);

	console.log('New access token stored.');

	const youtubeWithNewCredentials = google.youtube({
		version: 'v3',
		auth: oauth2Client
	});
	
	return youtubeWithNewCredentials;
}