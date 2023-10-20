import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/dev/callback'; // Update with your API Gateway URL

export const auth = async (event: any) => {
    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload&access_type=offline`;

    return {
        statusCode: 302, // HTTP status code for redirection
        headers: {
            Location: oauthUrl
        },
        body: '' // body is not used in redirects
    };
};

export const callback = async (event: any) => {
    const code = event.queryStringParameters.code;
    
    try {
        const { data } = await axios.post('https://oauth2.googleapis.com/token', {
            code: code,
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            redirect_uri: REDIRECT_URI,
            grant_type: 'authorization_code'
        });

        // Store response.data.access_token and response.data.refresh_token securely!
        return {
            statusCode: 200,
            body: JSON.stringify(data, null, 2)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: 'Failed to retrieve tokens.'
        };
    }
};
