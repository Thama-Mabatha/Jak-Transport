import * as signalR from '@microsoft/signalr';
import { API_DOMAIN } from '../../constants/api';

let connection;

export const createNotificationConnection = (userId) => {
  connection = new signalR.HubConnectionBuilder()
    .withUrl(`${API_DOMAIN}/notificationHub?userId=${userId}`)
    .withAutomaticReconnect()
    .build();

  return connection;
};

export const getConnection = () => connection;