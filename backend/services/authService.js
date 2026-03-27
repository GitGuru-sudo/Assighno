import { firebaseAdmin } from '../config/firebase.js';
import { User } from '../models/User.js';

export const verifyFirebaseToken = async (token) => {
  return firebaseAdmin.auth().verifyIdToken(token);
};

export const upsertUserFromDecodedToken = async (decodedToken, profile = {}) => {
  const email = decodedToken.email?.toLowerCase();
  const displayName = profile.display_name?.trim() || decodedToken.name?.trim();

  if (!email) {
    throw new Error('Firebase token does not include an email');
  }

  return User.findOneAndUpdate(
    { firebase_uid: decodedToken.uid },
    {
      firebase_uid: decodedToken.uid,
      email,
      ...(displayName ? { display_name: displayName } : {}),
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    },
  );
};
