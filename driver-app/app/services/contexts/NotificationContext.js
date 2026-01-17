import { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [refreshJobs, setRefreshJobs] = useState(false);
  const [message, setMessage] = useState(null);

  const addNotification = (newNotification) => {
   setNotifications((prev) => [...prev, newNotification]);
   setHasNewNotification(true);
   setRefreshJobs(true);
   setMessage(newNotification.message);
  };

  return (
    <NotificationContext.Provider value={{
      hasNewNotification,
      setHasNewNotification,
      notifications,
      setNotifications,
      refreshJobs,
      setRefreshJobs,
      addNotification,
      message,
      setMessage,
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);