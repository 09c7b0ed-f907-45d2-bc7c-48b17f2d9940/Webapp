import { printUserMessage, printServerMessage } from './chatbox.js';
import { updateClientList, printUserCommand, printServerCommand } from './admin.js';
import { createLineChart } from './viz.js';

let ws;

export function connectWebSocket(isAdmin) {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(`ws://localhost:3000?admin=${isAdmin}`);

      ws.onopen = () => {
        console.log(`Connected to the WebSocket server as ${isAdmin ? 'admin' : 'user'}`);
        resolve();
      };

      ws.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        await handleIncommingMessage(data, isAdmin);
      };

      ws.onclose = () => {
        console.log('Disconnected from the WebSocket server');
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };
    });
  }

  async function handleIncommingMessage(message, admin) {
    //Handle potential errors
    if (message.error) {
      message.message.forEach((errorMsg) => {
        printServerMessage(errorMsg.str);
      });
    }
    else {
      //Handle incomming message
      console.log("Handling message");
      console.log(message);
      if (message.message) {
        //Make single entries into array to be processed by forEach
        const messages = Array.isArray(message.message) ? message.message : [message.message];

        //Make printFunction functor
        //If admin print user message into server and opposite for user
        //set pintFunction either printServerMessage or printUserMessage
        messages.forEach(entrie => {
          const printFunction = admin
          ? (entrie.srv ? printUserMessage : printServerMessage)
          : (entrie.srv ? printServerMessage : printUserMessage);

          printFunction(entrie.str);
        });
      }
      //Handle incomming data
      if (message.data) {
        const json = message.data;
        //Received compressed jsons
        if (typeof json.data === 'string' && typeof json.args === 'string') {
          printServerMessage('Received both data and args, Creating a new chart....');
          const dataJson = await retrieveFileContent(json.data);
          const argsJson = await retrieveFileContent(json.args);
          createLineChart(dataJson, argsJson);
        }
        else if (typeof json.data === 'string') {
          printServerMessage('Received only data, Creating a new chart....');
          const dataJson = await retrieveFileContent(json.data);
          createLineChart(dataJson, undefined);
        }
        else if (typeof json.args === 'string') {
          printServerMessage('Received only args, Creating a new chart....');
          const argsJson = await retrieveFileContent(json.args);
          createLineChart(undefined, argsJson);
        }
        //Received clean jsons
        else if (json.data !== null && json.args !== null) {
          printServerMessage('Received both data and args, Creating a new chart....');
          createLineChart(json.data, json.args);
        }
        else {console.error("Received empty data field");}
      }
      //If the admin receive the list of users
      if (message.clients) {
        updateClientList(message.clients);
      }
      //answer of a bash request
      if (message.promptMsg) {
        printServerCommand(message.promptMsg.str, message.promptMsg.error);
      }
    }
  }

  // Fetch one or multiple jsons
  export function fetchData(json_name) {
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'fetchData', json_name}));
      } else {
        throw new Error('WebSocket is not connected');
      }
    } catch (error) { throw error; }
  }

  // Directory of the server and json name
  export function fetchUser(json_name) {
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'fetchUser', json_name}));
      } else {
        throw new Error('WebSocket is not connected');
      }
    } catch (error) { throw error; }
  }

  // Function to send a message to the server
  export function sendMessageServer(message) {
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'sendMessageToRasa', message }));
      } else {
        throw new Error('WebSocket is not connected');
      }
    } catch (error) { throw error; }
  }

  // Function to send a message to the selected user via the server
  export function sendMessageToUser(message) {
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ action: 'sendMessageToUser', message }));
      } else {
        throw new Error('WebSocket is not connected');
      }
    } catch (error) {
      console.error('Error sending message to user:', error.message);
      throw error;
    }
  }

  //Decompress the filecontent encapsulated by the server
  async function retrieveFileContent(fileContent) {
    const base64ToUint8Array = (base64) => Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const compressedData = base64ToUint8Array(fileContent);

    const decompressedStream = new DecompressionStream('gzip');
    const decompressedWriter = decompressedStream.writable.getWriter();
    decompressedWriter.write(compressedData);
    decompressedWriter.close();

    const stream = decompressedStream.readable.pipeThrough(new TextDecoderStream());

    let jsonString = '';
    const reader = stream.getReader();

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      jsonString += value;
    }
    return JSON.parse(jsonString);
  }

  export function sendAdminActionRequests(command) {
    try {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          action: 'admin',
          command: command
        }));
      } else {
        throw new Error('WebSocket is not connected');
      }
    } catch (error) {
      console.error('Error sending admin action requests:', error.message);
      throw error;
    }
  }
