import { useState, useEffect } from 'react';
import { firestore, Collections } from '../services/firebase';
import { Post } from '../types/post';

export const useUserPosts = (userId: string, userName?: string) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId && !userName?.trim()) {
      setPosts([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const unsubByUserId = userId
      ? firestore()
          .collection(Collections.POSTS)
          .where('postedBy.userId', '==', userId)
          .onSnapshot(
            snap => {
              if (!isMounted) return;

              const byIdResults = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
              if (byIdResults.length > 0 || !userName?.trim()) {
                byIdResults.sort((a, b) => a.recruitmentDeadline.localeCompare(b.recruitmentDeadline));
                setPosts(byIdResults);
                setLoading(false);
              } else {
                firestore()
                  .collection(Collections.POSTS)
                  .where('postedBy.name', '==', userName.trim())
                  .get()
                  .then(nameSnap => {
                    if (!isMounted) return;
                    const byNameResults = nameSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
                    byNameResults.sort((a, b) => a.recruitmentDeadline.localeCompare(b.recruitmentDeadline));
                    setPosts(byNameResults);
                    setLoading(false);
                  })
                  .catch(err => {
                    console.error('useUserPosts (name fallback):', err);
                    if (!isMounted) return;
                    setPosts([]);
                    setLoading(false);
                  });
              }
            },
            err => {
              console.error('useUserPosts (userId):', err);
              if (!isMounted) return;
              setLoading(false);
            }
          )
      : () => {};

    if (!userId && userName?.trim()) {
      firestore()
        .collection(Collections.POSTS)
        .where('postedBy.name', '==', userName.trim())
        .get()
        .then(snap => {
          if (!isMounted) return;
          const byNameResults = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
          byNameResults.sort((a, b) => a.recruitmentDeadline.localeCompare(b.recruitmentDeadline));
          setPosts(byNameResults);
          setLoading(false);
        })
        .catch(err => {
          console.error('useUserPosts (name only):', err);
          if (!isMounted) return;
          setPosts([]);
          setLoading(false);
        });
    }

    return () => {
      isMounted = false;
      unsubByUserId();
    };
  }, [userId, userName]);

  return { posts, loading };
};
