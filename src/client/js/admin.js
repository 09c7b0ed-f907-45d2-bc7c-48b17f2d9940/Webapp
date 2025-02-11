import { connectWebSocket, fetchData, fetchUser, sendAdminActionRequests } from './socket.js';
import { setupEventListeners, printUserMessage, printServerMessage, clearChatMessages } from './chatbox.js';
import { clearImagesGallery } from './viz.js'

window.onload = async () => {
  try {
    await connectWebSocket(true);
    setupEventListeners(true);
    setupPromptEventListener();
  } catch (error) {
    console.error('Error during initialization:', error);
  }
};

export function updateClientList(clients) {
  const { connectedList, userLoggedList } = clients;
  console.log('Updating client list:', clients);
  const clientSelector = document.getElementById('client-selector');
  clientSelector.innerHTML = '';  // Clear existing options

  // Add a default option
  const defaultOption = document.createElement('option');
  defaultOption.value = '';
  defaultOption.textContent = 'Select a client';
  clientSelector.appendChild(defaultOption);

  // Add logged clients options
  userLoggedList.forEach(userId => {
    const option = document.createElement('option');
    option.value = userId;
    option.textContent = userId;

    if (connectedList.includes(userId)) {
      option.classList.add('green'); // Connected client in green
    } else {
      option.classList.add('red'); // Logged but not connected client in red
    }

    clientSelector.appendChild(option);
  });

  // Set the selector to the default option
  clientSelector.value = '';
}

// Example function to handle client selection
export async function handleClientSelection(selectedUser) {
  try {
    console.log('Selected client:', selectedUser);
    clearChatMessages();
    clearImagesGallery();
    fetchUser(selectedUser);
  } catch (error) {
    throw error;
  }
}

export function toggleInputAndButton(isEnabled) {
  const messageInput = document.getElementById("input");
  const sendButton = document.getElementById("send");
  const inputContainer = document.getElementById("input-container");

  messageInput.disabled = !isEnabled;
  sendButton.disabled = !isEnabled;

  if (isEnabled) {
    messageInput.classList.remove("disabled");
    sendButton.classList.remove("disabled");
    inputContainer.classList.remove("disabled");
  } else {
    messageInput.classList.add("disabled");
    sendButton.classList.add("disabled");
    inputContainer.classList.add("disabled");
  }
}

//================= Admin Prompt Functions =====================//
function setupPromptEventListener() {
    document.getElementById('command-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            const inputField = document.getElementById('command-input');
            const command = inputField.value.trim();

            if (command) {
                // Show the user command
                printUserCommand(command);
                //send it to the server
                sendAdminActionRequests(command);

                // Clear the input field after sending the command
                inputField.value = '';
            }
        }
    });
}

export function printUserCommand(command) {
    const outputDiv = document.getElementById('output');
    const userCommandElement = document.createElement('div');
    userCommandElement.textContent = `[Admin]$ ${command}`;
    userCommandElement.classList.add('user-command');
    outputDiv.appendChild(userCommandElement);
    outputDiv.scrollTop = outputDiv.scrollHeight; // Scroll to the bottom
}

export function printServerCommand(response, error) {
    const outputDiv = document.getElementById('output');
    const serverResponseElement = document.createElement('div');
    serverResponseElement.textContent = response;
    if (error) {
      serverResponseElement.classList.add('server-error');
    }
    else {
      serverResponseElement.classList.add('server-response');
    }
    outputDiv.appendChild(serverResponseElement);
    outputDiv.scrollTop = outputDiv.scrollHeight; // Scroll to the bottom
}
