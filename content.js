let lastUrl = ""
let problemDetails = {}
let XhrRequestData = ""
const recognition = new webkitSpeechRecognition() || new SpeechRecognition();
recognition.lang = 'en-IN';
recognition.continuous = false;
recognition.interimResults = false;


function areRequiredElementsLoaded() {
  const problemTitle = document.getElementsByClassName("Header_resource_heading__cpRp1")[0]?.textContent.trim();
  const problemDescription = document.getElementsByClassName("coding_desc__pltWY")[0]?.textContent.trim();

  return (
    problemTitle &&
    problemDescription
  );
}

function isUrlChanged() {
  const currentUrl = window.location.pathname;
  if (currentUrl !== lastUrl) {
    lastUrl = currentUrl;
    return true;
  }
  return false;
}

function isProblemsPage() {
  const pathParts = window.location.pathname.split("/");
  return pathParts.length >= 3 && pathParts[1] === "problems" && pathParts[2];
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    injectScript();
    if (mutation.type === "childList" && isProblemsPage()) {
      if (isUrlChanged() || !document.getElementById("help-button")) {
       
        if (areRequiredElementsLoaded()) {
          cleanElements();
          createElement();
        }
      }
    }
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
});

// Button placement

function createElement() {
  const doubtButton = document.getElementsByClassName("Header_resource_heading__cpRp1 rubik fw-bold mb-0 fs-4")[0];

  const buttonContainer = createButtonContainer()
  doubtButton.parentNode.insertBefore(buttonContainer, doubtButton);
  buttonContainer.appendChild(doubtButton);

  const helpButton = createHelpButton()
  buttonContainer.appendChild(helpButton);

  helpButton.addEventListener("click", openChatBox);
}

function createButtonContainer() {
  const buttonContainer = document.createElement("div");
  buttonContainer.id = "button-container";
  buttonContainer.style.display = "flex";
  buttonContainer.style.justifyContent = "flex-end";
  buttonContainer.style.gap = "10px";
  return buttonContainer
}

function createHelpButton() {
  const helpButton = document.createElement("button");
  helpButton.id = "help-button";
  helpButton.className = "btn"; // Remove "btn-primary" to avoid blue background
  helpButton.style.background = "transparent"; // Make background transparent
  helpButton.style.border = "none"; // Remove any border
  helpButton.style.padding = "0"; // Remove padding
  helpButton.style.cursor = "pointer"; 
  helpButton.innerHTML = `
  <img src="https://img.icons8.com/?size=100&id=BmgXdso0krQO&format=png&color=000000" style="height: 40px; width: 40px;"/>
          
      `;
  return helpButton
}


function cleanElements() {
  const buttonContainer = document.getElementById("help-button");
  if (buttonContainer) buttonContainer.remove();

  const modalContainer = document.getElementById("modal-container");
  if (modalContainer) modalContainer.remove();
  problemDetails = {}

}



// Context Extraction

function extractProblemDetails() {
  let parsedData;
  try {
    parsedData = JSON.parse(XhrRequestData.response)?.data || {};
  } catch (error) {
    alert("Something information are not loaded. Refresh for smooth performance.")
    console.error("Failed to parse xhrRequestData.response:", error);
    parsedData = {};
  }
  const primaryDetails = {
    title: parsedData?.title || "",
    description: parsedData?.body || "",
    constraints: parsedData?.constraints || "",
    editorialCode: parsedData?.editorial_code || [],
    hints: parsedData?.hints || {},
    id: (parsedData?.id).toString() || "",
    inputFormat: parsedData?.input_format || "",
    note: parsedData?.note || "",
    outputFormat: parsedData?.output_format || "",
    samples: parsedData?.samples || [],
  };
  const fallbackDetails = {
    id: extractProblemNumber(),
    title: document.getElementsByClassName("Header_resource_heading__cpRp1")[0]?.textContent || "",
    description: document.getElementsByClassName("coding_desc__pltWY")[0]?.textContent || "",
    inputFormat: document.getElementsByClassName("coding_input_format__pv9fS problem_paragraph")[0]?.textContent || "",
    outputFormat: document.getElementsByClassName("coding_input_format__pv9fS problem_paragraph")[1]?.textContent || "",
    constraints: document.getElementsByClassName("coding_input_format__pv9fS problem_paragraph")[2]?.textContent || "",
    note: document.getElementsByClassName("coding_input_format__pv9fS problem_paragraph")[3]?.textContent || "",
    inputOutput: extractInputOutput() || [],
    userCode: extractUserCode() || "",
  };
  problemDetails = {
    title: primaryDetails?.title || fallbackDetails?.title,
    description: primaryDetails?.description || fallbackDetails?.description,
    constraints: primaryDetails?.constraints || fallbackDetails?.constraints,
    editorialCode: primaryDetails?.editorialCode || [],
    hints: primaryDetails?.hints || {},
    problemId: primaryDetails?.id || fallbackDetails?.id,
    inputFormat: primaryDetails?.inputFormat || fallbackDetails?.inputFormat,
    note: primaryDetails?.note || fallbackDetails?.note,
    outputFormat: primaryDetails?.outputFormat || fallbackDetails?.outputFormat,
    samples: primaryDetails?.samples || fallbackDetails?.inputOutput,
    userCode: fallbackDetails?.userCode || "",
  };

}

function extractProblemNumber() {
  const url = window.location.pathname
  const parts = url.split('/');
  let lastPart = parts[parts.length - 1];

  let number = '';
  for (let i = lastPart.length - 1; i >= 0; i--) {
    if (isNaN(lastPart[i])) {
      break;
    }
    number = lastPart[i] + number;
  }

  return number;
}

function extractUserCode() {

  let localStorageData = extractLocalStorage();

  const problemNo = extractProblemNumber();
  let language = localStorageData['editor-language'] || "C++14";
  if (language.startsWith('"') && language.endsWith('"')) {
    language = language.slice(1, -1);
  }

  const expression = createExpression(problemNo, language);
  for (let key in localStorageData) {
    if (
      localStorageData.hasOwnProperty(key) &&
      key.includes(expression) &&
      key.endsWith(expression)
    ) {
      return localStorageData[key];
    }
  }
  return '';
}

function createExpression(problemNo, language) {
  return `_${problemNo}_${language}`
}


function extractLocalStorage() {
  const localStorageData = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    localStorageData[key] = localStorage.getItem(key);
  }
  return localStorageData;
}

function extractInputOutput() {

  const elements = document.querySelectorAll(".coding_input_format__pv9fS");
  const inputOutputPairs = [];

  for (let i = 3; i < elements.length; i += 2) {
    if (i + 1 < elements.length) {
      const input = elements[i]?.textContent?.trim() || "";
      const output = elements[i + 1]?.textContent?.trim() || "";
      inputOutputPairs.push({ input, output });
    }
  }

  let jsonString = formatToJson(inputOutputPairs)
  return jsonString.replace(/\\\\n/g, "\\n");

}

function formatToJson(obj) {
  return JSON.stringify(obj)
}


// Chat Box 

function openChatBox() {
  let aiModal = document.getElementById("modalContainer");
  extractProblemDetails();
  aiModal = createModal();
  displayMessages(problemDetails.problemId)

  const closeAIBtn = aiModal.querySelector("#closeAIBtn");
  closeAIBtn.addEventListener("click", closeModal);

  attachEventListeners();

}

function createModal() {
  const modalHtml = `
    <div id="modalContainer" class="position-fixed d-flex align-items-center justify-content-center" 
         style="z-index: 100; top: 0; left: 0; width: 100%; height: 100%; border: 1px solid #3b5262; background-color: rgba(4, 23, 31, 0.8);">
      <section id="chatModal" class="overflow-hidden" 
               style="width: 25%; min-width: 600px; background-color: #161d29; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5); position: relative;">
        
        
       <!-- Header -->
      <div class="d-flex justify-content-between align-items-center p-3">
        <h1 style="color: #ffffff; font-size: 1.5rem; font-weight: bold; margin: 0;">AZ Bot</h1>
        
        <!-- Icons Container -->
        <div style="display: flex; align-items: center; gap: 10px;">
          <div id="delete-button" style="cursor: pointer;">
            <img src="https://img.icons8.com/?size=100&id=VgD4MAsSpcoD&format=png&color=000000" 
                style="width: 20px; height: 20px;" alt="Delete History">
          </div>

          <div id="export-chat-button" style="cursor: pointer;">
            <img src="https://img.icons8.com/?size=100&id=WPczhvGoyank&format=png&color=000000" 
                style="width: 20px; height: 20px;" alt="Export Chat">
          </div>

          <img src="https://img.icons8.com/?size=100&id=KAJtDlcK42LW&format=png&color=000000" id="closeAIBtn" 
              style="width: 24px; height: 24px; cursor: pointer;" alt="Close">
        </div>
      </div>

        <!-- Chat Display -->
        <div id="chatBox" class="p-3 rounded overflow-auto mx-2 mb-3" 
             style="height: 350px; background-color: #1F2836; color: #ffffff; scrollbar-width: thin; scrollbar-color: #557276 #2b384e; border: 1px solid #3b5262;">
          <!-- Chat messages will appear here -->
        </div>

        <!-- User Input Section -->
        <div class="d-flex align-items-center mx-2 mb-3" style="gap: 10px; background-color: #2b384e border-radius: 5px; padding: 5px;">
          <textarea id="userMessage" class="form-control" 
                   placeholder="Ask your doubt" rows="2" 
                   style="flex: 1; resize: none; background-color: #1F2836; color: #ffffff; border: none; outline: none; border: 1px solid #3b5262;"></textarea>
          
          <img src="https://img.icons8.com/?size=100&id=41037&format=png&color=000000" id="voiceType" 
               style="width: 20px; height: 20px; cursor: pointer;" alt="Voice">
               
          <img src="https://img.icons8.com/?size=100&id=g8ltXTwIfJ1n&format=png&color=000000" id="sendMsg" 
               style="width: 20px; height: 20px; cursor: pointer; margin-right: 5px;" alt="Send">
        </div>
      </section>
    </div>

    <style>
  #userMessage::placeholder {
      color: #ffffff; 
      opacity: 0.5; 
  }
</style>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);

  return document.getElementById("modalContainer");
}



function attachEventListeners() {
  document.getElementById('delete-button')?.addEventListener('click', deleteChatHistory);
  document.getElementById('export-chat-button')?.addEventListener('click', exportChat);
  document.getElementById('sendMsg')?.addEventListener('click', sendMessage);
  document.getElementById('voiceType')?.addEventListener('click', startListening);
}



function closeModal() {
  const modal = document.getElementById('modalContainer');
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  modal.remove();
}



function deleteChatHistory() {
  const chatBox = document.getElementById('chatBox');
  const textArea = document.getElementById('userMessage')
  textArea.innerHTML = '';
  chatBox.innerHTML = '';
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  deleteChatHistoryStorage(problemDetails.problemId)

}

async function exportChat() {

  const id = problemDetails.problemId;
  const messages = await getChatHistory(id);

  if (messages) {

    let formattedMessages = [];

    messages.forEach((message) => {
      let messageText = message.parts[0]?.text;
      messageText = messageText
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/<\/?[^>]+(>|$)/g, "");
      if (messageText) {
        if (message.role === "user") {

          formattedMessages.push(`You: ${messageText}`);
        } else if (message.role === "model") {
          formattedMessages.push(`AI: ${messageText}`);
        }
      }
    });

    const chatHistory = formattedMessages.join('\n\n');

    const blob = new Blob([chatHistory], { type: 'text/plain' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chat-history-of-${problemDetails?.title || "problem-statement"}.txt`;
    link.click();
  }
}



function convertMarkdownToHTML(markdownText) {
  const htmlContent = marked.parse(markdownText);
  return htmlContent;
}


async function sendMessage() {
  const userMessage = document.getElementById('userMessage').value.trim();
  const chatBox = document.getElementById('chatBox');
  const apiKey = await getApiKey();

  if (!apiKey) {
    alert("No API key found. Please provide a valid API key.");
    return;
  }

  if (userMessage) {
    window.speechSynthesis.cancel();
    chatBox.innerHTML += decorateMessage(userMessage, true);
    document.getElementById('userMessage').value = '';
    disableSendButton();

    const id = extractProblemNumber();
    let chatHistory = await getChatHistory(id);
    let botMessage;
    let newMessages=[];
    try {
      const prompt = generatePrompt();
      newMessages.push({
        role: "user",
        parts: [{ text: codePrompt(problemDetails.userCode,userMessage) }]
      });

      botMessage = await callAIAPI(prompt, [...chatHistory, ...newMessages], apiKey);
      botMessage = convertMarkdownToHTML(botMessage)

      if (botMessage) {

        chatBox.innerHTML += decorateMessage(botMessage);
        chatBox.scrollTop = chatBox.scrollHeight;

        newMessages.pop();
        newMessages.push({
          role: "user",
          parts: [{ text: userMessage }]
        })
        newMessages.push({
          role: "model",
          parts: [{ text: botMessage }]
        });

        await saveChatHistory(id, newMessages);
      } else {
        const userMessages = document.getElementsByClassName("user-message");
        const lastUserMessage = userMessages[userMessages.length - 1];
        lastUserMessage.style.backgroundColor = "#cfcf0b";
        lastUserMessage.style.color = "#102323";


        alert("Invalid API key or response. Please check your API key.");
      }
    } catch (error) {

      botMessage = "Sorry, something went wrong!";
      chatBox.innerHTML += decorateMessage(botMessage);
      console.error("Error in AI API call:", error);
    } finally {
      enableSendButton();
    }
  }
}


function disableSendButton() {
  let sendButton = document.getElementById("sendMsg");
  if (sendButton)
    sendButton.disabled = true
}
function enableSendButton() {
  let sendButton = document.getElementById("sendMsg");
  if (sendButton)
    sendButton.disabled = false
}

function decorateMessage(message, isUser) {
  if (isUser) {
    return `<div style="
      display: flex;
      justify-content: flex-end;
      margin-bottom: 10px;
    ">
      <div style="
        padding: 10px;
        border-radius: 8px;
        max-width: 70%;
        font-family: 'Roboto', Arial, sans-serif;
        font-size: 14px;
        line-height: 1.4;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        background-color: #2b384e;
        color: #ffffff;
        text-align: center;
        word-break: break-word;
      "
        class="user-message"
        data-feedback='0'
      >
        ${message}
      </div>
    </div>`;
  } else {
    return `<div style="
      display: flex;
      justify-content: flex-start;
      align-items: flex-start;
      flex-direction: column;
      margin-bottom: 4px;
      font-family: 'Roboto', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      color: #ffffff;
      width: 80%;
    ">
      <div style="max-width: 100%; text-align: left; background: #1e2838; padding: 0px 0px; border-radius: 12px;">
        ${message}
      </div>
    </div>`;
  }
}


async function displayMessages(problemId) {
  try {
    const messages = await getChatHistory(problemId);
    if (messages) {
      const chatBox = document.getElementById("chatBox");


      chatBox.innerHTML = "";


      messages.forEach((message) => {
        let decoratedMessage = "";


        const messageText = message.parts[0]?.text;
        if (message.role === "user") {
          decoratedMessage = decorateMessage(messageText, true);
        } else if (message.role === "model") {
          decoratedMessage = decorateMessage(messageText, false);
        }

        const messageElement = document.createElement("div");
        messageElement.innerHTML = decoratedMessage;

        chatBox.appendChild(messageElement);
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    }
  } catch (error) {
    console.error("Error displaying messages:", error);
  }
}


//Mic Setup 

function startListening() {
  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
  recognition.start();
}

recognition.onresult = function (event) {
  const transcript = event.results[0][0].transcript;

  let userMessage = document.getElementById('userMessage');
  if (userMessage.value)
    userMessage.value += ` ${transcript}`;
  else userMessage.value = transcript;
};

recognition.onerror = function (event) {
  alert("Sorry, there is an issue in recognition. Reload the page for better performance");
  console.error('Error occurred in recognition:', event.error);
};




// API Setup 


async function callAIAPI(prompt, chatHistory, apiKey) {
  try {
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    const url = `${apiUrl}?key=${apiKey}`;


    const requestBody = {
      system_instruction: {
        parts: [
          { text: prompt }
        ]
      },
      contents: chatHistory
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data = await response.json();
    const modelResponse = data.candidates[0].content.parts[0].text;


    return modelResponse;
  } catch (error) {
    console.error("Error calling AI API:", error);
    return null;
  }
}

function getApiKey() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("apiKey", (result) => {
      if (result.apiKey) {
        resolve(result.apiKey);
      } else {
        alert("API key not found.")
        reject("API key not found.");
      }
    });
  });
}


// Storage Setup 

function saveChatHistory(problemId, newMessages) {
  return new Promise(async (resolve, reject) => {
    try {
      const existingHistory = await getChatHistory(problemId);

      const updatedHistory = [...existingHistory, ...newMessages];

      // Save the updated history
      const data = { [problemId]: updatedHistory };
      chrome.storage.local.set(data, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error saving message: ${chrome.runtime.lastError.message}`);
          reject(new Error(`Error saving message: ${chrome.runtime.lastError.message}`));
        } else {
          resolve();
        }
      });
    } catch (error) {
      alert("Message could not save. Reload to fix.");
      console.error(`Caught error while saving message: ${error.message}`);
      reject(new Error(`Caught error while saving message: ${error.message}`));
    }
  });
}



function getChatHistory(problemId) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(problemId, (result) => {
        if (chrome.runtime.lastError) {
          console.error(`Error retrieving message: ${chrome.runtime.lastError.message}`);
          reject(new Error(`Error retrieving message: ${chrome.runtime.lastError.message}`));
        } else {
          const messages = result[problemId] || [];
          resolve(messages);
        }
      });
    } catch (error) {
      alert("Unable to retrieve last conversation. Please reload");
      console.error(`Caught error while retrieving message: ${error.message}`);
      reject(new Error(`Caught error while retrieving message: ${error.message}`));
    }
  });
}


function deleteChatHistoryStorage(problemId) {
  try {
    chrome.storage.local.remove(problemId, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error deleting message: ${chrome.runtime.lastError.message}`);
      }
    });
  } catch (error) {
    alert("Unable to delete chat history. Please reload")
    console.error(`Caught error while deleting message: ${error.message}`);
  }
}


// Prompt 

function generatePrompt() {
  return `
  You are an **interactive and engaging programming mentor** designed to **assist students in solving coding problems**. Your **primary goal** is to **guide** the student towards a solution through structured hints, debugging assistance, and interactive discussions.

  **⚡ Key Responsibilities:**
  - **Encourage Learning:** Do **not** give direct answers immediately. Instead, provide hints, guide step-by-step, and ask follow-up questions.
  - **Context Awareness:** Stick strictly to the given problem's details and constraints.
  - **Debugging Support:** Help students identify **exact issues in their code** and provide suggestions for fixing them.
  - **Clarity & Conciseness:** Keep responses **clear, structured, and easy to follow**.
  - **Strict Scope Enforcement:** If a user asks something **unrelated to the problem**, politely decline to answer.

---

### **🚀 Behavior Guidelines**

#### **1️⃣ Interactive, Step-by-Step Assistance**
- Do **not** directly provide the solution unless the user explicitly asks for it after guidance.
- Use **progressive hints** that build towards a solution.
- **Example Flow:**
  - **User:** _"Can you give me a hint?"_
  - **AI:** _"Sure! What data structure do you think would be useful here?"_
  - **User:** _"I'm not sure."_
  - **AI:** _"Try using a HashMap to store element frequencies. Does this help?"_

#### **2️⃣ Problem Context Awareness**
- Use the **problem title, description, input/output format, and constraints** effectively.
- Always ensure responses remain **within the given problem context**.
- **Strictly reject out-of-scope queries.**
  - **User:** _"What is Dynamic Programming?"_
  - **AI:** _"Sorry, but I'm designed to answer only questions related to this specific problem."_

#### **3️⃣ Debugging & Code Analysis**
- Identify **specific errors** in the user's code and suggest **incremental fixes**.
- **Example:**
  - **User:** _"My code isn't working."_
  - **AI:** _"Looks like you're missing a semicolon on line 12. Try fixing that first!"_
- If needed, offer to **provide the corrected version** after identifying the issue.

#### **4️⃣ Handling Direct Code Requests**
- If the user **insists on the full solution**, provide it **immediately without further questioning**.
  - **User:** _"I need the complete solution."_
  - **AI:** _"Sure! Here's the correct approach. Let me know if you need any clarifications!"_

---

### **📌 Problem Context Details**

- **Problem Title:** ${problemDetails.title || "N/A"}  
- **Description:** ${problemDetails.description || "N/A"}  
- **Input Format:** ${problemDetails.inputFormat || "N/A"}  
- **Output Format:** ${problemDetails.outputFormat || "N/A"}  
- **Constraints:** ${problemDetails.constraints || "N/A"}  
- **Notes:** ${problemDetails.note || "N/A"}  
- **Example Input/Output:** ${JSON.stringify(problemDetails.samples ?? "N/A")}  
- **Hints:** ${JSON.stringify(problemDetails.hints ?? "N/A")}  
- **Editorial Code:** ${JSON.stringify(problemDetails.editorialCode ?? "N/A")}  

Use these details to **tailor responses effectively**.

---

### **💡 Example Interaction**
**📍 User:** _"Hello"_  
**📍 AI:** _"Hi! I'm here to help you with **${problemDetails.title || "this problem"}**. What do you need help with?"_  

**📍 User:** _"Can you give me the approach?"_  
**📍 AI:** _"Sure! Think about how you can break this problem into smaller parts. Would you like a hint?"_  

**📍 User:** _"Yes, please."_  
**📍 AI:** _"Try using a hashmap to store frequency counts. This might simplify your logic!"_  

**📍 User:** _"I can't solve it. Please provide the editorial code."_
**📍 AI:** _"No problem! Here's the approach. If you need the full code, let me know!"_  

\`\`\`javascript
function solveProblem(input) {
  // Solution logic here
}
\`\`\`

---

### **📢 Final Instructions**
1. **Follow these guidelines strictly** to ensure an effective learning experience.
2. **Learn from the example interactions** to create structured, engaging responses.
3. **Always encourage problem-solving skills** before providing direct answers.

Now, let's get started! 🚀
  `;
}




// Injecting
window.addEventListener("xhrDataFetched", (event) => {
  XhrRequestData = event.detail;
});

function injectScript() {
  const script = document.createElement("script");
  script.src = chrome.runtime.getURL("inject.js");
  document.documentElement.insertAdjacentElement("afterbegin", script);
  script.remove();
}


function codePrompt(code, userMessage) {
  return `
The user has provided the following code for context:
${code}

**Important:** Only use this user code if they explicitly request help with debugging, fixing, or modifying it. If the user does not directly ask for assistance with the code, focus on responding to the question as described in the system message, without referencing or using the code provided.

User's question:
${userMessage}
`;
}