import { sendMessageServer, sendMessageToUser, fetchData } from './socket.js';
import { createLineChart } from './viz.js';
import { handleClientSelection, toggleInputAndButton } from './admin.js';

// WebSocket
let xy = {};
let yAxis = 'Age';
let xAxis = 'Gender';
let plotType = 'line';
let trendLineChecked = false;
let errorBarChecked = false;
let nationalValuesChecked = false;
let selectedHospitals = [];

const generateXAndYAxisDropdowns = () => {
  const xDropdown = document.getElementById("x-axis-select");
  const yDropdown = document.getElementById("y-axis-select");
  Object.keys(xy).forEach((key) => {
    const xoption = document.createElement("option");
    xoption.value = key;
    xoption.text = key;
    const yoption = document.createElement("option");
    yoption.value = key;
    yoption.text = key;
    xDropdown.appendChild(xoption);
    yDropdown.appendChild(yoption);
  });
};

export async function setupEventListeners(admin) {
  const messageInput = document.getElementById("input");
  const sendButton = document.getElementById("send");
  messageInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      sendMessage(admin);
    }
  });
  sendButton.onclick = () => {sendMessage(admin);};
  const menuButton = document.getElementById("pop-up-button");
  menuButton.onclick = openMenu;
  const thumbnails = document.getElementsByClassName("gallery-image");
  for (let i = 0; thumbnails.length; i++) {
    thumbnails[i].addEventListener("click", () => {
      showImage(thumbnails[i]);
    });
  }
/*
  const yAxisSelect = document.getElementById("y-axis-select");
  yAxisSelect.addEventListener("change", (event) => {
    yAxis = event.target.value;
  });
  const xAxisSelect = document.getElementById("x-axis-select");
  xAxisSelect.addEventListener("change", (event) => {
    xAxis = event.target.value;
  });
  const trendLine = document.getElementById("trend-line");
  trendLine.addEventListener("change", (event) => {
    trendLineChecked = trendLine.checked;
  });
  const errorBar = document.getElementById("error-bar");
  errorBar.addEventListener("change", (event) => {
    errorBarChecked = errorBar.checked;
  });
  const nationalValues = document.getElementById("national-values");
  nationalValues.addEventListener("change", (event) => {
    nationalValuesChecked = nationalValues.checked;
  });

  const hospitalComparison = document.getElementById("hospital-select");
  hospitalComparison.addEventListener("change", (event) => {
    selectedHospitals = Array.from(hospitalComparison.options)
    .filter(option => option.selected)
    .map(option => option.value);
    if (selectedHospitals.includes('None')) {
      console.log("None selected");
      selectedHospitals = ['None'];
    } else {
      console.log(selectedHospitals);
    }
  });
*/
  //Add the event for the client selector if admin
  if (admin) {
    const clientSelector = document.getElementById('client-selector');
    clientSelector.addEventListener('change', (event) => {
      const selectedValue = event.target.value;
      const selectedOption = event.target.options[event.target.selectedIndex];

      // Manage state if connected or not
      clientSelector.classList.remove('green', 'red');
      if (selectedOption.classList.contains('green')) {
        clientSelector.classList.add('green');
        toggleInputAndButton(true);
      } else if (selectedOption.classList.contains('red')) {
        clientSelector.classList.add('red');
        toggleInputAndButton(false);
      } else {
        toggleInputAndButton(false);
      }

      if (selectedValue) {
        handleClientSelection(selectedValue);
      }
      else {
        clearChatMessages();
      }
    });
  }
}

export function showImage(thumbnail) {
  console.log(thumbnail);
  const overlay = document.getElementById("overlay");
  overlay.src = thumbnail.src;
  overlay.classList.remove("hidden");

  const chart = document.getElementById("viz");
  chart.classList.add("hidden");

  const selected = document.getElementsByClassName("thumbnail-selected");
  console.log(selected);

  if (selected.length != 0) {
    console.log("removing class" + selected);
    selected[0].classList.remove("thumbnail-selected");
    thumbnail.classList.add("thumbnail-selected");
  } else {
    thumbnail.classList.add("thumbnail-selected");
  }
}

function openMenu() {
  const menu = document.getElementById("pop-up");
  const menuButton = document.getElementById("pop-up-button");
  if (menu.classList.contains("pop-up-expanded")) {
    menu.classList.remove("pop-up-expanded");
    menuButton.classList.remove("rotate");
  } else {
    menu.classList.add("pop-up-expanded");
    menuButton.classList.add("rotate");
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const chartLibrary = [];
  const galleryContainer = document.getElementById("gallery-container");

  for (let i = 0; i < chartLibrary.length; i++) {
    let img = new Image();
    img = document.createElement("img");
    img.classList.add("gallery-image");
    img.src = chartLibrary[i];
    galleryContainer.appendChild(img);
  }
});

export async function sendMessage(isAdmin) {
  const messageInput = document.getElementById("input");
  const message = messageInput.value;
  messageInput.value = "";

  if (isAdmin) {
    //Send the string into the selected client
    try {
      printUserMessage(message);
      sendMessageToUser(message);
    } catch (error) {
      console.error(error);
    }
  }
  else {
    //Send the string into the nodejs server
    try {
      printUserMessage(message);
      sendMessageServer(message);
    } catch (error) {
      console.error(error);
    }
  }
}

//Set user message in the front and set it to the server
export function printUserMessage(message) {
  if (message.trim() !== "") {
    const chatContainer = document.getElementById("chat");
    const userMessageContainer = document.createElement("div");
    userMessageContainer.classList.add("message-container");

    const userMessage = document.createElement("p");
    userMessage.classList.add("user-message");
    userMessage.textContent = message;

    const messengerID = document.createElement("p");
    messengerID.classList.add("messenger-id");
    messengerID.textContent = "User:";

    userMessageContainer.appendChild(messengerID);
    userMessageContainer.appendChild(userMessage);

    chatContainer.appendChild(userMessageContainer);
  }
}

//Set Bot message inside the chatbox
export function printServerMessage(message) {
  const chatContainer = document.getElementById("chat");
  const chatbotMessageContainer = document.createElement("div");
  chatbotMessageContainer.classList.add("ca-message-container");

  const botMessage = document.createElement("p");
  botMessage.classList.add("received-message");
  botMessage.textContent = message;

  const botMessengerID = document.createElement("p");
  botMessengerID.classList.add("chatbot-id");
  botMessengerID.textContent = "Chatbot:";

  chatbotMessageContainer.appendChild(botMessengerID);
  chatbotMessageContainer.appendChild(botMessage);

  chatContainer.appendChild(chatbotMessageContainer);
}

export function clearChatMessages() {
  const chatContainer = document.getElementById("chat");
  chatContainer.innerHTML = "";
}

function changeColor(elementId, colorClass) {
  const element = document.getElementById(elementId);
  element.className = colorClass;
}
