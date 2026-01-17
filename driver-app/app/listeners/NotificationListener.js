import * as signalR from '@microsoft/signalr';
import { useNotification } from '../../services/contexts/NotificationContext';

export default function NotificationListener() {
  const {
    setHasNewNotification,
    setNotifications,
    setRefreshJobs,
    setMessage
  } = useNotification();

  useEffect(() => {
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://jakmove.xyz/notificationHub")
      .withAutomaticReconnect()
      .build();

    connection.start().then(() => {
      console.log("Connected to SignalR");
    });

    connection.on("ReceiveNotification", (notification) => {
      setHasNewNotification(true);
      setNotifications(prev => [notification, ...prev]);

      if (notification.title === "New Job") {
        setMessage(notification.message);
        setRefreshJobs(true); // trigger refresh
      }
    });

    return () => {
      connection.stop();
    };
  }, []);

  return null;
}