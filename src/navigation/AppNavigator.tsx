import React, { useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { SearchScreen } from '../screens/SearchScreen';
import { SavesScreen } from '../screens/SavesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { PostingScreen } from '../screens/PostingScreen';

const Tab = createBottomTabNavigator();

const HOME_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
  <path d="M3.25 13L5.41667 10.8333M5.41667 10.8333L13 3.25L20.5833 10.8333M5.41667 10.8333V21.6667C5.41667 22.265 5.90169 22.75 6.5 22.75H9.75M20.5833 10.8333L22.75 13M20.5833 10.8333V21.6667C20.5833 22.265 20.0983 22.75 19.5 22.75H16.25M9.75 22.75C10.3483 22.75 10.8333 22.265 10.8333 21.6667V17.3333C10.8333 16.735 11.3184 16.25 11.9167 16.25H14.0833C14.6816 16.25 15.1667 16.735 15.1667 17.3333V21.6667C15.1667 22.265 15.6517 22.75 16.25 22.75M9.75 22.75H16.25" stroke="#2D2C2C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const BELL_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M12.9999 3.24999C11.276 3.24999 9.62271 3.93481 8.40372 5.1538C7.18474 6.37279 6.49992 8.02609 6.49992 9.75V15.1667C6.49992 15.9339 6.29644 16.6802 5.91937 17.3333H20.0805C19.7034 16.6802 19.4999 15.9339 19.4999 15.1667V9.75C19.4999 8.02609 18.8151 6.37279 17.5961 5.1538C16.3771 3.93481 14.7238 3.24999 12.9999 3.24999ZM23.8333 17.3333C23.2586 17.3333 22.7075 17.1051 22.3012 16.6987C21.8949 16.2924 21.6666 15.7413 21.6666 15.1667V9.75C21.6666 7.45145 20.7535 5.24705 19.1282 3.62174C17.5029 1.99642 15.2985 1.08333 12.9999 1.08333C10.7014 1.08333 8.49698 1.99642 6.87166 3.62174C5.24634 5.24705 4.33325 7.45145 4.33325 9.75V15.1667C4.33325 15.7413 4.10498 16.2924 3.69865 16.6987C3.29232 17.1051 2.74122 17.3333 2.16659 17.3333C1.56828 17.3333 1.08325 17.8184 1.08325 18.4167C1.08325 19.015 1.56828 19.5 2.16659 19.5H23.8333V17.3333ZM10.5822 21.8129C11.0997 21.5127 11.7626 21.6889 12.0628 22.2064C12.1581 22.3706 12.2948 22.5068 12.4592 22.6016C12.6237 22.6963 12.8101 22.7462 12.9999 22.7462C13.1897 22.7462 13.3762 22.6963 13.5406 22.6016C13.7051 22.5068 13.8418 22.3706 13.937 22.2064C14.2372 21.6889 14.9001 21.5127 15.4177 21.8129C15.9352 22.1131 16.1114 22.776 15.8112 23.2936C15.5255 23.7861 15.1154 24.1949 14.622 24.4791C14.1287 24.7632 13.5693 24.9128 12.9999 24.9128C12.4306 24.9128 11.8712 24.7632 11.3778 24.4791C10.8844 24.1949 10.4744 23.7861 10.1887 23.2936C9.88846 22.776 10.0646 22.1131 10.5822 21.8129Z" fill="#2D2C2C"/>
</svg>`;

const BOOKMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="18" viewBox="0 0 14 18" fill="none">
  <path d="M0 17.5V13H6L0 17.5Z" fill="#2D2C2C"/>
  <path d="M14 17.5V13H8L14 17.5Z" fill="#2D2C2C"/>
  <rect width="14" height="14" fill="#2D2C2C"/>
</svg>`;

const USER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 26 26" fill="none">
  <path d="M17.3334 7.58333C17.3334 9.97657 15.3933 11.9167 13.0001 11.9167C10.6068 11.9167 8.66675 9.97657 8.66675 7.58333C8.66675 5.1901 10.6068 3.25 13.0001 3.25C15.3933 3.25 17.3334 5.1901 17.3334 7.58333Z" stroke="#2D2C2C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13.0001 15.1667C8.81192 15.1667 5.41675 18.5618 5.41675 22.75H20.5834C20.5834 18.5618 17.1882 15.1667 13.0001 15.1667Z" stroke="#2D2C2C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const PLUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none">
  <circle cx="24" cy="24" r="24" fill="#2D2C2C"/>
  <path d="M24 14V34M14 24H34" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

// Dummy screen — never actually shown, the + tab opens a modal instead
const EmptyScreen = () => <View style={{ flex: 1, backgroundColor: '#2D2C2C' }} />;

export const AppNavigator = () => {
  const [showPosting, setShowPosting] = useState(false);

  return (
    <>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E5E5',
            height: 80,
            paddingBottom: 16,
          },
          tabBarActiveTintColor: '#000000',
          tabBarInactiveTintColor: '#555555',
          tabBarLabel: () => null,
        }}
      >
        <Tab.Screen
          name="Home"
          component={SearchScreen}
          options={{
            tabBarIcon: () => <SvgXml xml={HOME_SVG} width={26} height={26} />,
          }}
        />
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            tabBarIcon: () => <SvgXml xml={BELL_SVG} width={26} height={26} />,
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
            tabBarIcon: () => <SvgXml xml={BOOKMARK_SVG} width={14} height={18} />,
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: () => <SvgXml xml={USER_SVG} width={26} height={26} />,
          }}
        />
      </Tab.Navigator>

      {/* Slides up over whatever tab you're on */}
      <PostingScreen
        visible={showPosting}
        onClose={() => setShowPosting(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({});
