import { verifyFirebaseToken, upsertUserFromDecodedToken } from '../services/authService.js';
import { HttpError } from '../utils/http.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing Authorization bearer token');
    }

    // Every protected request is tied back to Firebase so the API can trust the caller identity.
    const token = authorization.slice('Bearer '.length);
    const decodedToken = await verifyFirebaseToken(token);
    const profile = typeof req.body === 'object' && req.body ? req.body : {};
    const user = await upsertUserFromDecodedToken(decodedToken, profile);

    req.auth = decodedToken;
    req.user = user;
    next();
  } catch (error) {
    next(error.statusCode ? error : new HttpError(401, 'Invalid Firebase token'));
  }
};
