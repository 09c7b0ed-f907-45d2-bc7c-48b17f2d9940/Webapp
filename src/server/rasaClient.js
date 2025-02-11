const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const RASA_URL = 'http://localhost:5005/webhooks/rest/webhook';
const ACTION_URL = 'http://localhost:5055/webhook';

//One file per client to solve concurrency problems
// Function to setup logging for a user
function setupLogging(userId) {
  // Create logs directory if it doesn't exist
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir);
  }

  // Create file if it doesn't exist and initialize with an empty array
  const logFilePath = path.join(logsDir, `${userId}.json`);
  if (!fs.existsSync(logFilePath)) {
    fs.writeFileSync(logFilePath, '[]');
  }
  return logFilePath;
}

//Function to log a UserInteraction (User + Rasa)
function logInteraction(fileHandle, userTimestamp, userMessage, rasaTimestamp, rasaResponse) {
  const logEntries = [];

  // User message log entry
  logEntries.push({ timestamp: userTimestamp, message: { str: userMessage, srv: false } });

  // Rasa response log entries
  rasaResponse.message.forEach(response => {
    logEntries.push({ timestamp: rasaTimestamp, message: { str: response.str, srv: response.srv } });
  });

  // Log the data if present
  if (rasaResponse.data) {
    logEntries.push({
      timestamp: rasaTimestamp,
      data: { data: rasaResponse.data?.data?.file_content,
        args: rasaResponse.data?.args?.file_content }
    });
  }

  // Read the existing content of the file and parse it
  let logArray;
  try {
    const fileContent = fs.readFileSync(fileHandle, 'utf8');
    logArray = JSON.parse(fileContent);
  } catch (error) {
    logArray = [];
  }

  // Append the new log entries and write it
  logArray = logArray.concat(logEntries);
  fs.writeFileSync(fileHandle, JSON.stringify(logArray, null, 2));
}

//Function to log a single entry
function logSingleEntry(fileHandle, message, isServer) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp: timestamp,
    message: { str: message, srv: isServer }
  };

  // Read the existing content of the file and parse it
  let logArray;
  try {
    const fileContent = fs.readFileSync(fileHandle, 'utf8');
    logArray = JSON.parse(fileContent);
  } catch (error) {
    logArray = [];
  }

  // Append the new log entry
  logArray.push(logEntry);

  // Write the updated log array back to the file
  fs.writeFileSync(fileHandle, JSON.stringify(logArray, null, 2));
}

//Fetch the online clients UUID
function getUserLoggedList() {
  const logsDir = path.join(__dirname, 'logs');
  if (!fs.existsSync(logsDir)) {
    return [];
  }

  const files = fs.readdirSync(logsDir);
  return files.map(file => path.basename(file, '.json'));
}

//Parse the logs json into a message frame for the user
function parseLogsToSend(logs) {
  const messageLogs = logs.filter(log => log.message !== undefined).map(log => log.message);

  const dataMap = logs.reduce((acc, log) => {
    if (log.data) {
      if (log.data.data !== undefined) {
        acc.data = log.data.data;
      }
      if (log.data.args !== undefined) {
        acc.args = log.data.args;
      }
    }
    return acc;
  }, { data: null, args: null });

  return {
    message: messageLogs,
    data: dataMap
  };
}

//Request on Rasa and Parsing Message
function sendMessageToRasa(message, userId) {
  return fetch(RASA_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ sender: userId, message }),
  })
  .then(response => response.json())
  .then(data => {
    //For each element, pushing string message and args/data json
    const formattedResponse = { message: [], data: {} };
    data.forEach((item) => {
      if (item.text) {
        formattedResponse.message.push({str :item.text, srv : true});
        //{str : , srv:true}
      } else {
        formattedResponse.data = item.custom;
      }
    });

    return formattedResponse;
  })
  .catch(error => {
    throw new Error(`Failed to send message to Rasa: ${error.message}`);
  });
}

//Parse the command string into a JSON fot the triggerAction
function parseCommand(command) {
    const parts = command.trim().split(/\s+/);
    if (parts.length < 1) {
        throw new Error('Invalid command format');
    }

    const action = parts[0];
    const slots = {};
    for (let i = 1; i < parts.length; i += 2) {
        const slotName = parts[i].replace('--', '');
        const slotValue = parts[i + 1];
        if (!slotName || !slotValue) {
            throw new Error('Invalid slot format');
        }
        slots[slotName] = slotValue;
    }

    return { action, slots };
}

//Send a Frame like RASA for the Action server
function triggerAction(nextAction, slot) {
  const payload = {
    next_action: nextAction,
    tracker: {
      sender_id: "test_user",
      slots: slot,
      latest_message: {
        text: "blblblblb",
        intent: {
          name: "admin",
          confidence: 0.99
        },
        entities: []
      },
      paused: false,
      events: [],
      active_loop: null,
      latest_action_name: null
    },
    domain: {
      intents: ["admin"],
      entities: [],
      slots: {},
      responses: {},
      actions: [nextAction]
    }
  };

  return fetch(ACTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log(`Action ${nextAction} triggered successfully.`);
    return data;
  })
  .catch(error => {
    console.error(`Failed to trigger action ${nextAction}:`, error);
    throw new Error(`Failed to trigger action: ${error.message}`);
  });
}

module.exports = { sendMessageToRasa, parseCommand, triggerAction, setupLogging, logInteraction, logSingleEntry, getUserLoggedList, parseLogsToSend };
