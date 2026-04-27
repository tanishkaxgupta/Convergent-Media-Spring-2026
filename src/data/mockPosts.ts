import { Post } from '../types/post';

/** Headshot URLs keyed by the userId values used in MOCK_POSTS[].postedBy.userId */
export const MOCK_POSTER_HEADSHOTS: Record<string, string> = {
  'user-1': 'https://randomuser.me/api/portraits/women/22.jpg',
  'user-2': 'https://randomuser.me/api/portraits/men/32.jpg',
  'user-3': 'https://randomuser.me/api/portraits/women/7.jpg',
  'user-4': 'https://randomuser.me/api/portraits/men/44.jpg',
};

export const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    filmName: 'Neon Dusk',
    director: ['Priya Anand'],
    description: 'Indie noir short set in the neon-lit streets of Austin. We\'re building a small, tight-knit crew for a 3-day shoot. Passion project with festival ambitions.',
    recruitmentDeadline: '2026-05-01T00:00:00Z',
    shootingTimeline: {
      startDate: '2026-05-23T00:00:00Z',
      endDate: '2026-05-25T00:00:00Z',
    },
    roles: [
      {
        title: 'Cinematographer',
        description: 'In need of a cinematographer for a film noir short set in Austin. Experience with low-light and practical lighting preferred.',
        type: 'tech',
      },
      {
        title: 'Sound Designer',
        description: 'On-set and post-production audio. Must have own equipment and experience with dialogue recording.',
        type: 'tech',
      },
    ],
    shootingLocation: { city: 'Austin', state: 'TX', details: 'UT Campus area' },
    postedBy: { userId: 'user-1', name: 'Priya Anand', school: 'University of Texas at Austin' },
    media: {
      script: '',
      videos: [],
      images: [
        { id: 'img-1a', url: 'https://picsum.photos/seed/neondusk1/800/500', caption: 'Set photo' },
        { id: 'img-1b', url: 'https://picsum.photos/seed/neondusk2/800/500', caption: 'Location scouting' },
      ],
    },
    searchKeywords: ['cinematographer', 'sound designer', 'neon dusk', 'noir', 'austin'],
    roleTypesList: ['tech'],
    shootingStateLower: 'tx',
    shootingCityLower: 'austin',
    schoolLower: 'university of texas at austin',
  },
  {
    id: 'mock-2',
    filmName: 'Between the Frames',
    director: ['Marcus Webb'],
    description: 'A drama-horror hybrid short about grief and memory. Filming in Round Rock over two weeks. We\'re looking for dedicated crew who love the genre.',
    recruitmentDeadline: '2026-04-25T00:00:00Z',
    shootingTimeline: {
      startDate: '2026-05-05T00:00:00Z',
      endDate: '2026-05-20T00:00:00Z',
    },
    roles: [
      {
        title: 'Lead Actor',
        description: 'Looking for a lead actor to play a 25-year-old. We need a portfolio that showcases a wide range of acting abilities.',
        type: 'actor',
      },
      {
        title: 'Supporting Actress',
        description: 'Working on male and female actors in a psychological horror setting. Strong improv skills a plus.',
        type: 'actor',
      },
      {
        title: 'Gaffer',
        description: 'Not a paid opportunity, but meals and credit provided. Must have experience on short film sets.',
        type: 'crew',
      },
    ],
    shootingLocation: { city: 'Round Rock', state: 'TX', details: 'Various locations' },
    postedBy: { userId: 'user-2', name: 'Marcus Webb', school: 'University of Texas at Austin' },
    media: {
      script: '',
      videos: [],
      images: [
        { id: 'img-2a', url: 'https://picsum.photos/seed/betweenframes/800/500', caption: 'Behind the scenes' },
        { id: 'img-2b', url: 'https://picsum.photos/seed/betweenframes2/800/500', caption: 'Location' },
      ],
    },
    searchKeywords: ['actor', 'actress', 'gaffer', 'between the frames', 'drama', 'horror'],
    roleTypesList: ['actor', 'crew'],
    shootingStateLower: 'tx',
    shootingCityLower: 'round rock',
    schoolLower: 'university of texas at austin',
  },
  {
    id: 'mock-3',
    filmName: 'Quiet Hours',
    director: ['Sofia Reyes'],
    description: 'Contemporary dance film exploring isolation and connection. Urgent opening — our original HMUA had an emergency and we need a replacement ASAP. Monetary compensation available.',
    recruitmentDeadline: '2026-03-28T00:00:00Z',
    shootingTimeline: {
      startDate: '2026-05-10T00:00:00Z',
      endDate: '2026-05-25T00:00:00Z',
    },
    roles: [
      {
        title: 'HMUA',
        description: 'Our makeup artist had an emergency. We need a new HMUA ASAP for a slasher short film. Monetary compensation for short notice!',
        type: 'crew',
      },
      {
        title: 'Composer',
        description: 'Original score for a 15-minute short. Must be able to deliver stems and a final mix. Portfolio required.',
        type: 'musician',
      },
    ],
    shootingLocation: { city: 'Austin', state: 'TX', details: 'South Austin' },
    postedBy: { userId: 'user-3', name: 'Alexa Martinez', school: 'University of Texas at Austin' },
    media: { script: '', videos: [], images: [] },
    searchKeywords: ['dancer', 'composer', 'quiet hours', 'music', 'contemporary', 'hmua'],
    roleTypesList: ['crew', 'musician'],
    shootingStateLower: 'tx',
    shootingCityLower: 'austin',
    schoolLower: 'university of texas at austin',
  },
  {
    id: 'mock-4',
    filmName: 'The Last Signal',
    director: ['James Park'],
    description: 'Sci-fi short about first contact set on The Drag. Looking for a skilled editor and production assistant to round out our crew for a 3-week summer shoot.',
    recruitmentDeadline: '2026-03-15T00:00:00Z',
    shootingTimeline: {
      startDate: '2026-06-01T00:00:00Z',
      endDate: '2026-06-20T00:00:00Z',
    },
    roles: [
      {
        title: 'Editor',
        description: 'Looking for an editor for a sci-fi short film shot on the Drag. Adobe Premiere or DaVinci Resolve required. Color grading experience a plus.',
        type: 'tech',
      },
      {
        title: 'Production Assistant',
        description: 'On-set PA for a 3-week shoot. Must be reliable, organized, and comfortable with early call times.',
        type: 'crew',
      },
    ],
    shootingLocation: { city: 'Austin', state: 'TX', details: 'The Drag & campus' },
    postedBy: { userId: 'user-4', name: 'Alex Maide', school: 'University of Texas at Austin' },
    media: { script: '', videos: [], images: [] },
    searchKeywords: ['editor', 'production assistant', 'the last signal', 'sci-fi', 'austin'],
    roleTypesList: ['tech', 'crew'],
    shootingStateLower: 'tx',
    shootingCityLower: 'austin',
    schoolLower: 'university of texas at austin',
  },
];
