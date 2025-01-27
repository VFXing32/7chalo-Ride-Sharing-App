import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";
import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation,  } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Requests: undefined;
  ShowRides: undefined;
  // Add other screens as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

const NotificationContext = createContext<NotificationContextType>({
  expoPushToken: null,
  notification: null,
  error: null
});

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const navigationRef = useRef<NavigationProp>(null);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    Notifications.setNotificationCategoryAsync('RIDE_REQUEST', [
      {
        identifier: 'ACCEPT',
        buttonTitle: 'Accept',
        options: {
          opensAppToForeground: true,
        }
      },
      {
        identifier: 'DENY',
        buttonTitle: 'Deny',
        options: {
          opensAppToForeground: true,
        }
      }
    ]);
  }, []);

  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // Configure notification handler
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
          }),
        });

        const token = await registerForPushNotificationsAsync();
        setExpoPushToken(token);
        
        // Store token in AsyncStorage for persistence
        if (token) {
          await AsyncStorage.setItem('@7chalo:pushToken', token);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    };

    setupNotifications();

    notificationListener.current = Notifications.addNotificationReceivedListener(
      notification => {
        console.log("🔔 Notification Received:", notification);
        setNotification(notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        console.log("🔔 Notification Response:", response);
        // Handle notification tap/interaction
        const data = response.notification.request.content.data;
        handleNotificationResponse(data);
      }
    );

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const handleNotificationResponse = (data: any) => {
    switch (data.type) {
      case 'new_request':
      case 'request_update':
        navigationRef.current?.navigate('Requests');
        break;
      case 'ride_update':
        navigationRef.current?.navigate('ShowRides');
        break;
      default:
        console.log('Unknown notification type:', data.type);
    }
  };

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification, error }}>
      {children}
    </NotificationContext.Provider>
  );
};