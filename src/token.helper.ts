import { SecretsManager } from 'aws-sdk';
import { google } from 'googleapis';

const secretsManager = new SecretsManager();

const SECRET_NAME = 'youtube-tokens';

export async function getStoredTokens(): Promise<{ accessToken: string; refreshToken: string[] }> {
    const data = await secretsManager.getSecretValue({ SecretId: SECRET_NAME }).promise();
    const secrets = JSON.parse(data.SecretString!);

    const refreshTokens = Array.isArray(secrets.refreshTokens) ? secrets.refreshTokens : [secrets.refreshToken];

    return {
        accessToken: secrets.accessToken,
        refreshToken: refreshTokens
    };
}

export async function storeNewTokens(accessToken: string, newRefreshToken?: string[]): Promise<void> {
    const currentSecrets = await getStoredTokens();
    const updatedSecrets = {
        ...currentSecrets,
        accessToken: accessToken,
        ...(newRefreshToken ? { refreshTokens: [newRefreshToken, ...currentSecrets.refreshToken] } : {})
    };
    await secretsManager.putSecretValue({
        SecretId: SECRET_NAME,
        SecretString: JSON.stringify(updatedSecrets)
    }).promise();
}

export async function generateNewToken(refreshToken: string[]) {
	const oauth2Client = new google.auth.OAuth2(
		process.env.CLIENT_ID,
		process.env.CLIENT_SECRET,
	);

	
    let newAccessToken = null;
    const validRefreshTokens = [];

    for (const token of refreshToken) {
        oauth2Client.setCredentials({ refresh_token: token });
        try {
            const newTokens = await oauth2Client.refreshAccessToken();
            
            newAccessToken = newTokens.credentials.access_token;
            validRefreshTokens.push(token);

            if (newTokens.credentials.refresh_token) {
                // If a new refresh token is provided, store it
                validRefreshTokens.push(newTokens.credentials.refresh_token);
            }
            break;
        } catch (error) {
            console.log('Failed to refresh using a token, trying next...');
        }
    }
    if (!newAccessToken) {
        throw new Error('All refresh tokens are invalid. Manual re-authorization required.');
    }
    // Store the valid refresh tokens back to Secrets Manager
    await storeNewTokens(newAccessToken, validRefreshTokens);

	console.log('New access token stored.');

	const youtubeWithNewCredentials = google.youtube({
		version: 'v3',
		auth: oauth2Client
	});
	
	return youtubeWithNewCredentials;
}