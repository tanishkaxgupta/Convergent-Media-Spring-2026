import { Post } from '../types/post';

export const MOCK_POSTS: Post[] = [
  {
    id: 'mock-1',
    filmName: 'Neon Dusk',
    director: ['Priya Anand'],
    recruitmentDeadline: '2026-05-01T00:00:00Z',
    shootingTimeline: {
      startDate: '2026-05-23T00:00:00Z',
      endDate: '2026-05-25T00:00:00Z',
    },
    roles: [
      {
        title: 'Cinematographer',
        description: 'In need of a cinematographer for a film noir short set in Austin.',
        type: 'tech',
      },
      {
        title: 'Sound Designer',
        description: 'on-set and post-production audio',
        type: 'tech',
      },
    ],
    shootingLocation: { city: 'Austin', state: 'TX', details: 'UT Campus area' },
    postedBy: { userId: 'user-1', name: 'Priya Anand', school: 'UT Austin' },
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
    schoolLower: 'ut austin',
  },
  {
    id: 'mock-2',
    filmName: 'Between the Frames',
    director: ['Marcus Webb'],
    recruitmentDeadline: '2026-04-25T00:00:00Z',
    shootingTimeline: {
      startDate: '2026-05-05T00:00:00Z',
      endDate: '2026-05-20T00:00:00Z',
    },
    roles: [
      {
        title: 'Lead Actor',
        description: 'In need of SFX hair stylist for horror short film',
        type: 'actor',
      },
      {
        title: 'Supporting Actress',
        description: 'working on male and female actors',
        type: 'actor',
      },
      {
        title: 'Gaffer',
        description: 'not a paid opportunity',
        type: 'crew',
      },
    ],
    shootingLocation: { city: 'Round Rock', state: 'TX', details: 'Various locations' },
    postedBy: { userId: 'user-2', name: 'Marcus Webb', school: 'UT Austin' },
    media: {
      script: '',
      videos: [],
      images: [
        { id: 'img-2a', url: 'https://picsum.photos/seed/betweenframes/800/500', caption: 'Behind the scenes' },
      ],
    },
    searchKeywords: ['actor', 'actress', 'gaffer', 'between the frames', 'drama', 'horror'],
    roleTypesList: ['actor', 'crew'],
    shootingStateLower: 'tx',
    shootingCityLower: 'round rock',
    schoolLower: 'ut austin',
  },
  {
    id: 'mock-3',
    filmName: 'Quiet Hours',
    director: ['Sofia Reyes'],
    recruitmentDeadline: '2026-04-30T00:00:00Z',
    shootingTimeline: {
      startDate: '2026-05-10T00:00:00Z',
      endDate: '2026-05-25T00:00:00Z',
    },
    roles: [
      {
        title: 'Dancer',
        description: 'Our makeup artist had an emergency, we need a new HMUA asap for a slasher short film! monetary compensation for short notice!',
        type: 'dancer',
      },
      {
        title: 'Composer',
        description: 'original score for a 15-min short',
        type: 'musician',
      },
    ],
    shootingLocation: { city: 'Austin', state: 'TX', details: 'South Austin' },
    postedBy: { userId: 'user-3', name: 'Jenny Doe', school: 'UT Austin' },
    media: { script: '', videos: [], images: [] },
    searchKeywords: ['dancer', 'composer', 'quiet hours', 'music', 'contemporary', 'hmua'],
    roleTypesList: ['dancer', 'musician'],
    shootingStateLower: 'tx',
    shootingCityLower: 'austin',
    schoolLower: 'ut austin',
  },
  {
    id: 'mock-4',
    filmName: 'The Last Signal',
    director: ['James Park'],
    recruitmentDeadline: '2026-05-10T00:00:00Z',
    shootingTimeline: {
      startDate: '2026-06-01T00:00:00Z',
      endDate: '2026-06-20T00:00:00Z',
    },
    roles: [
      {
        title: 'Editor',
        description: 'Looking for an editor for a sci-fi short film shot on the Drag.',
        type: 'tech',
      },
      {
        title: 'Production Assistant',
        description: 'on-set PA for a 3-week shoot',
        type: 'crew',
      },
    ],
    shootingLocation: { city: 'Austin', state: 'TX', details: 'The Drag & campus' },
    postedBy: { userId: 'user-4', name: 'Jess Doe', school: 'UT Austin' },
    media: { script: '', videos: [], images: [] },
    searchKeywords: ['editor', 'production assistant', 'the last signal', 'sci-fi', 'austin'],
    roleTypesList: ['tech', 'crew'],
    shootingStateLower: 'tx',
    shootingCityLower: 'austin',
    schoolLower: 'ut austin',
  },
];
