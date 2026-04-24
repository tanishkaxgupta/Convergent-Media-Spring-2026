import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { SearchScreen } from '../screens/SearchScreen';
import { SavesScreen } from '../screens/SavesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { PostingScreen } from '../screens/PostingScreen';
import { PostDetailScreen } from '../screens/PostDetailScreen';
import { ApplicantScreen } from '../screens/ApplicantScreen';

export type RootStackParamList = {
  Tabs: undefined;
  PostDetail: { postId: string };
  Applicant: { applicantId: string; postId: string; applicationId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

const homeSvg = (color: string, focused: boolean) => focused
  ? `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M13 3.25L20.5833 10.8333V22.75H15.1667V17.3333H10.8333V22.75H5.41667V10.8333L13 3.25Z" fill="${color}"/>
    </svg>`
  : `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M3.25 13L5.41667 10.8333M5.41667 10.8333L13 3.25L20.5833 10.8333M5.41667 10.8333V21.6667C5.41667 22.265 5.90169 22.75 6.5 22.75H9.75M20.5833 10.8333L22.75 13M20.5833 10.8333V21.6667C20.5833 22.265 20.0983 22.75 19.5 22.75H16.25M9.75 22.75C10.3483 22.75 10.8333 22.265 10.8333 21.6667V17.3333C10.8333 16.735 11.3184 16.25 11.9167 16.25H14.0833C14.6816 16.25 15.1667 16.735 15.1667 17.3333V21.6667C15.1667 22.265 15.6517 22.75 16.25 22.75M9.75 22.75H16.25" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

const bellSvg = (color: string, focused: boolean) => focused
  ? `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M19.5 15.1667V9.75C19.5 6.30228 16.4477 3.25 13 3.25C9.55228 3.25 6.5 6.30228 6.5 9.75V15.1667C6.5 16.2713 5.89141 17.3333 4.33333 17.3333H21.6667C20.1086 17.3333 19.5 16.2713 19.5 15.1667Z" fill="${color}"/>
      <rect x="1.08325" y="17.3333" width="23.8333" height="2.16667" rx="1.08333" fill="${color}"/>
      <path d="M10.5833 19.5C10.5833 21.433 11.6637 22.75 13 22.75C14.3363 22.75 15.4167 21.433 15.4167 19.5" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    </svg>`
  : `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M19.5 15.1667V9.75C19.5 6.30228 16.4477 3.25 13 3.25C9.55228 3.25 6.5 6.30228 6.5 9.75V15.1667C6.5 16.2713 5.89141 17.3333 4.33333 17.3333H21.6667C20.1086 17.3333 19.5 16.2713 19.5 15.1667Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M1.08325 18.4167H24.9166" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
      <path d="M10.5833 19.5C10.5833 21.433 11.6637 22.75 13 22.75C14.3363 22.75 15.4167 21.433 15.4167 19.5" stroke="${color}" stroke-width="2" stroke-linecap="round"/>
    </svg>`;

const bookmarkSvg = (color: string, focused: boolean) => focused
  ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18" fill="none">
      <path d="M1 1H13V17L7 13L1 17V1Z" fill="${color}"/>
    </svg>`
  : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18" fill="none">
      <path d="M1 1H13V17L7 13L1 17V1Z" stroke="${color}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

const userSvg = (color: string, focused: boolean) => focused
  ? `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
      <circle cx="13.0001" cy="7.58333" r="4.33333" fill="${color}"/>
      <path d="M5.41675 22.75C5.41675 18.5618 8.81192 15.1667 13.0001 15.1667C17.1882 15.1667 20.5834 18.5618 20.5834 22.75H5.41675Z" fill="${color}"/>
    </svg>`
  : `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
      <path d="M17.3334 7.58333C17.3334 9.97657 15.3933 11.9167 13.0001 11.9167C10.6068 11.9167 8.66675 9.97657 8.66675 7.58333C8.66675 5.1901 10.6068 3.25 13.0001 3.25C15.3933 3.25 17.3334 5.1901 17.3334 7.58333Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M13.0001 15.1667C8.81192 15.1667 5.41675 18.5618 5.41675 22.75H20.5834C20.5834 18.5618 17.1882 15.1667 13.0001 15.1667Z" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

const PLUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <circle cx="24" cy="24" r="24" fill="#2D2C2C"/>
  <path d="M24 14V34M14 24H34" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;


// Dummy screen — never actually shown, the + tab opens a modal instead
const EmptyScreen = () => <View style={{ flex: 1, backgroundColor: '#2D2C2C' }} />;

const TabNavigator = () => {
  const [showPosting, setShowPosting] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E5E5',
            height: 80,
          },
          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: '#AAAAAA',
          tabBarLabel: () => null,
          tabBarItemStyle: { paddingVertical: 8 },
        }}
      >
        <Tab.Screen
          name="Home"
          component={SearchScreen}
          options={{
            tabBarIcon: ({ color, focused }) => <SvgXml xml={homeSvg(color, focused)} width={26} height={26} />,
          }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            tabBarIcon: ({ color, focused }) => <SvgXml xml={bellSvg(color, focused)} width={26} height={26} />,
          }}
        />
        <Tab.Screen
          name="Post"
          component={EmptyScreen}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              setShowPosting(true);
            },
          }}
          options={{
            tabBarIcon: () => <SvgXml xml={PLUS_SVG} width={48} height={48} />,
          }}
        />
        <Tab.Screen
          name="Saves"
          component={SavesScreen}
          options={{
            tabBarIcon: ({ color, focused }) => <SvgXml xml={bookmarkSvg(color, focused)} width={14} height={18} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, focused }) => <SvgXml xml={userSvg(color, focused)} width={26} height={26} />,
          }}
        />
      </Tab.Navigator>
      <PostingScreen visible={showPosting} onClose={() => setShowPosting(false)} />
    </>
  );
};

export const AppNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Tabs" component={TabNavigator} />
    <Stack.Screen name="PostDetail" component={PostDetailScreen} />
    <Stack.Screen name="Applicant" component={ApplicantScreen} />
  </Stack.Navigator>
);