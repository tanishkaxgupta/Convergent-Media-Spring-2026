import firebase from 'firebase/compat/app';
import { firestore, storage, Collections } from './firebase';
import { Post, RoleType } from '../types/post';


const uriToBlob = async (uri: string): Promise<Blob> => {
  const response = await fetch(uri);
  return response.blob();
};

const uploadFiles = async (uris: string[], folder: string): Promise<string[]> => {
  return Promise.all(
    uris.map(async (uri) => {
      const filename = uri.split('/').pop() ?? Date.now().toString();
      const ref = storage().ref(`${folder}/${Date.now()}_${filename}`);
      await ref.putFile(uri);
      return ref.getDownloadURL();
    })
  );
};

interface CreatePostParams {
  filmName: string;
  roleTypes: string[];
  imageUris?: string[];
  videoUris?: string[];
}

export const createPost = async (
  userId: string,
  params: CreatePostParams
): Promise<string> => {
  const { filmName, roleTypes, imageUris = [], videoUris = [] } = params;

  const [imageUrls, videoUrls] = await Promise.all([
    imageUris.length ? uploadFiles(imageUris, 'posts/images') : Promise.resolve([]),
    videoUris.length ? uploadFiles(videoUris, 'posts/videos') : Promise.resolve([]),
  ]);

  const docRef = await firestore()
    .collection(Collections.POSTS)
    .add({
      filmName,
      roleTypes,
      media: { images: imageUrls, videos: videoUrls },
      postedBy: userId,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

  return docRef.id;
};

interface ApplyParams {
  roleTitle: string;
  message?: string;
}

export const applyToPost = async (
  postId: string,
  applicantId: string,
  params: ApplyParams
): Promise<string> => {
  const existing = await firestore()
    .collection(Collections.APPLICATIONS)
    .where('postId', '==', postId)
    .where('applicantId', '==', applicantId)
    .get();

  if (!existing.empty) throw new Error('You already applied to this post');

  const docRef = await firestore()
    .collection(Collections.APPLICATIONS)
    .add({
      postId,
      applicantId,
      roleTitle: params.roleTitle,
      message: params.message ?? '',
      status: 'pending',
      appliedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

  return docRef.id;
};

export const getApplicants = async (postId: string) => {
  const snap = await firestore()
    .collection(Collections.APPLICATIONS)
    .where('postId', '==', postId)
    .get();

  return Promise.all(
    snap.docs.map(async (d) => {
      const application = { id: d.id, ...d.data() };
      const userSnap = await firestore()
        .collection(Collections.USERS)
        .doc((application as any).applicantId)
        .get();
      return {
        ...application,
        profile: userSnap.exists() ? userSnap.data() : null,
      };
    })
  );
};

export const buildPostForFirestore = (post: Omit<Post, 'id' | 'searchKeywords' | 'roleTypesList' | 'shootingStateLower' | 'shootingCityLower' | 'schoolLower'>) => {
    const keywords = new Set<string>();
  
    // Index film name words
    post.filmName.toLowerCase().split(/\s+/).forEach(w => keywords.add(w));
  
    // Index director names
    post.director.forEach(d =>
      d.toLowerCase().split(/\s+/).forEach(w => keywords.add(w))
    );
  
    // Index role titles
    post.roles.forEach(r =>
      r.title.toLowerCase().split(/\s+/).forEach(w => keywords.add(w))
    );
  
    // Index school
    post.postedBy.school.toLowerCase().split(/\s+/).forEach(w => keywords.add(w));
  
    return {
      ...post,
      searchKeywords: Array.from(keywords),
      roleTypesList: [...new Set(post.roles.map(r => r.type))] as RoleType[],
      shootingStateLower: post.shootingLocation.state.toLowerCase(),
      shootingCityLower: post.shootingLocation.city.toLowerCase(),
      schoolLower: post.postedBy.school.toLowerCase(),
    };
  };