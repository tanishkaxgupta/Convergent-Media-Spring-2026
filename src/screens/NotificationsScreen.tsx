import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  SafeAreaView, 
  StatusBar 
} from 'react-native';
import { Notification } from '../types/notification';

// Mock data using your new Notification type
const DATA: Notification[] = [
  {
    id: '1',
    type: 'application_status',
    title: 'Application Status Update',
    body: 'Your application for John Doe is now Under Review',
    createdAt: '5 hours ago',
    isRead: false,
    targetUserId: 'user123'
  },
  {
    id: '2',
    type: 'post_recommendation',
    title: 'New Post You Might Like',
    body: '3 new acting postings match your saved searches',
    createdAt: '3 days ago',
    isRead: false,
    targetUserId: 'user123'
  }
];

const NotificationsScreen = () => {

  const renderItem = ({ item }: { item: Notification }) => {
    const isStatus = item.type === 'application_status';
    
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          {/* Icon Placeholder using a View instead of a library */}
          <View style={[
            styles.iconCircle, 
            { backgroundColor: isStatus ? '#D8E2F9' : '#DCF6E6' }
          ]}>
            <Text style={{ fontSize: 20 }}>{isStatus ? '💼' : '✨'}</Text>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.time}>{item.createdAt}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      <FlatList
        data={DATA}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listPadding}
        ListHeaderComponent={() => (
          <View style={styles.sectionHeader}>
            <View style={styles.dot} />
            <Text style={styles.sectionText}>Today</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E1E', // Matching the dark theme in your figma
  },
  header: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  listPadding: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#888',
    marginRight: 8,
  },
  sectionText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
  },
  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  time: {
    fontSize: 12,
    color: '#666',
    marginVertical: 2,
  },
  body: {
    fontSize: 14,
    color: '#333',
  },
});

export { NotificationsScreen };