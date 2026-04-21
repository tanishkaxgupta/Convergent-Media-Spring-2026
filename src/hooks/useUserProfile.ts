import { useState, useEffect } from 'react';
import { firestore, Collections } from '../services/firebase';
import { UserProfile } from '../types/user';

export const useUserProfile = (userId: string) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = firestore()
      .collection(Collections.USERS)
      .doc(userId)
      .onSnapshot(
        doc => {
          if (doc.exists) {
            setProfile({ id: doc.id, ...doc.data() } as UserProfile);
          }
          setLoading(false);
        },
        err => {
          setError(err.message);
          setLoading(false);
        }
      );

    return unsubscribe;
  }, [userId]);

  return { profile, loading, error };
};