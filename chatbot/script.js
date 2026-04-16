
const chatBox = document.getElementById('chat-box');
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const speakBtn = document.getElementById('speak-btn');
let recognizing = false;
let recognition;
const voiceBtn = document.createElement('button');
voiceBtn.type = 'button';
voiceBtn.id = 'voice-btn';
voiceBtn.title = 'Speak to Chatbot';
voiceBtn.textContent = '🎤';
if (chatForm) chatForm.appendChild(voiceBtn);
const logoutBtn = document.getElementById('logout-btn');
const welcomeDiv = document.getElementById('welcome');

// Authentication check
const username = localStorage.getItem('chatbot_username');
const role = localStorage.getItem('chatbot_role');
if (!username || !role) {
    window.location.href = 'login.html';
}

// Show welcome message with username and role
if (welcomeDiv && username && role) {
    welcomeDiv.style.display = 'block';
    welcomeDiv.textContent = `Welcome, ${username}! (Role: ${role})`;
}

// Logout logic
if (logoutBtn) {
    logoutBtn.onclick = function() {
        localStorage.removeItem('chatbot_username');
        localStorage.removeItem('chatbot_role');
        window.location.href = 'login.html';
    };
}

let lastBotMsg = '';
function appendMessage(sender, text) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.textContent = text;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (sender === 'bot') {
        lastBotMsg = text;
        // Speak bot message automatically
        if ('speechSynthesis' in window && text) {
            const utter = new window.SpeechSynthesisUtterance(text);
            window.speechSynthesis.speak(utter);
        }
    }
}

function botReply(userMsg) {
    // Simple bot logic
    const msg = userMsg.toLowerCase();
    if (msg.includes('hello') || msg.includes('hi')) {
        return `hello ${username} ! How can I assist you today ?`;
    } else if (msg.includes('your name')) {
        return "I'm Jarves, your simple chatbot.";
    } else if (msg.includes('time')) {
        return `The current time is ${new Date().toLocaleTimeString()}.`;
    } else if (msg.includes('date')) {
        return `Today's date is ${new Date().toLocaleDateString()}.`;
    } else if (msg.includes('bye')) {
        return "Goodbye! Have a great day!";
    } else {
        return null; // Not found, trigger Google search
    }
}



chatForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const userMsg = userInput.value.trim();
    if (!userMsg) return;
    appendMessage('user', userMsg);
    setTimeout(() => {
        const reply = botReply(userMsg);
        if (reply !== null) {
            appendMessage('bot', reply);
        } else {
            appendMessage('bot', "Let me search Google for you...");
            searchGoogle(userMsg);
        }
    }, 500);
    userInput.value = '';
});

// Google search integration (opens a new tab and tries to fetch a snippet)
function searchGoogle(query) {
    // Try to fetch a snippet using Google Custom Search API or fallback to opening a tab
    // For demo, open Google in a new tab and show a message
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    // Open Google in a new tab
    window.open(url, '_blank');
    // Show message in chat
    setTimeout(() => {
        appendMessage('bot', "I have opened Google search for your question. Please check the new tab for the answer.");
    }, 1000);
}

// Speaking feature (manual)
if (speakBtn) {
    speakBtn.addEventListener('click', function() {
        if ('speechSynthesis' in window && lastBotMsg) {
            const utter = new window.SpeechSynthesisUtterance(lastBotMsg);
            window.speechSynthesis.speak(utter);
        }
    });
}

// User voice input feature
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = function() {
        recognizing = true;
        voiceBtn.textContent = '🛑';
    };
    recognition.onend = function() {
        recognizing = false;
        voiceBtn.textContent = '🎤';
    };
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        userInput.value = transcript;
        chatForm.dispatchEvent(new Event('submit'));
    };

    voiceBtn.addEventListener('click', function() {
        if (recognizing) {
            recognition.stop();
            return;
        }
        recognition.start();
    });
} else {
    voiceBtn.style.display = 'none';
}

// Logout feature
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        localStorage.removeItem('chatbot_username');
        window.location.href = 'login.html';
    });
}
