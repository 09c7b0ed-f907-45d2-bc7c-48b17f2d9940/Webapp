import { connectWebSocket, fetchData, sendMessageServer } from './socket.js';
import { setupEventListeners } from './chatbox.js';

window.onload = async () => {
  try {
    await connectWebSocket(false);
    await fetchData(["data", "args"]);
    setupEventListeners(false);
  } catch (error) {
    console.error('Error during initialization:', error);
  }
};
