document.addEventListener('DOMContentLoaded', () => {
    // -------------------- User System --------------------
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

    function saveUsers() {
        localStorage.setItem('users', JSON.stringify(users));
    }

    function saveCurrentUser() {
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // If user is already logged in, redirect to the schedule page in html5 folder
    if (currentUser) {
        window.location.href = "html5/index.html";
        return;
    }

    function showLogin() {
        const loginForm = document.getElementById('login');
        const userPanel = document.getElementById('user-panel');
        if (loginForm) loginForm.style.display = 'flex';
        if (userPanel) userPanel.style.display = 'none';
    }

    function showUserPanel() {
        const loginForm = document.getElementById('login');
        const userPanel = document.getElementById('user-panel');
        if (loginForm) loginForm.style.display = 'none';
        if (userPanel) {
            userPanel.style.display = 'flex';
            document.getElementById('user-name').textContent = currentUser ? currentUser.username : '';
        }
    }

    // Display the correct UI
    if (currentUser) showUserPanel();
    else showLogin();

    // ----- Login Form -----
    const loginForm = document.getElementById('login');
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            e.preventDefault();
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            const user = users.find(u => u.username === username && u.password === password);

            if (user) {
                currentUser = user;
                saveCurrentUser();
                window.location.href = "html5/index.html"; // Correct redirect
            } else {
                alert("Invalid username or password");
            }
        });
    }

    // ----- Register Form -----
    const registerForm = document.getElementById('register');
    if (registerForm) {
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;

            if (users.find(u => u.username === username)) {
                alert("Username already exists");
            } else {
                const newUser = { username, password };
                users.push(newUser);
                saveUsers();
                alert("Registered successfully");
                registerForm.reset();
            }
        });
    }

    // ----- Logout -----
    const logoutBtn = document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            currentUser = null;
            saveCurrentUser();
            showLogin();
        });
    }

    // ----- Delete Account -----
    const deleteBtn = document.getElementById('delete-account');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to delete your account?")) {
                users = users.filter(u => u.username !== currentUser.username);
                saveUsers();
                currentUser = null;
                saveCurrentUser();
                showLogin();
            }
        });
    }

    // -------------------- Chatbot --------------------
    const chatMessages = document.getElementById('chatbot-messages');
    const chatInput = document.getElementById('chatbot-input');
    const chatSend = document.getElementById('chatbot-send');
    const chatBody = document.getElementById('chatbot-body');

    let conversationHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    conversationHistory.forEach(msg => addMessage(msg.message, msg.sender));

    function addMessage(message, sender = 'user') {
        if (!chatMessages) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = sender === 'user' ? 'chat-msg user-msg' : 'chat-msg bot-msg';
        msgDiv.textContent = message;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        conversationHistory.push({ sender, message });
        if (conversationHistory.length > 50) conversationHistory.shift();
        localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
    }

    function botReply(userText) {
        const text = userText.toLowerCase().trim();
        if (/hello|hi|hey/.test(text)) return "Hello! How can I assist you today?";
        if (/services/.test(text)) return "We offer Web Development, Design Consulting, SEO Optimization, and Customer Support.";
        if (/contact|email|phone/.test(text)) return "You can reach us at info@mywebsite.com or call (123) 456-7890.";
        if (/about/.test(text)) return "We are a dedicated team providing high-quality services.";
        if (/register|sign up/.test(text)) return "You can register using the form in the Register section.";
        if (/time/.test(text)) return `Current time is ${new Date().toLocaleTimeString()}`;
        if (/date/.test(text)) return `Today's date is ${new Date().toLocaleDateString()}`;
        return "I'm sorry, I don't fully understand. Can you rephrase your question?";
    }

    function botTyping(callback) {
        if (!chatMessages) return;
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-msg bot-msg';
        typingDiv.textContent = 'Bot is typing...';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        setTimeout(() => {
            typingDiv.remove();
            callback();
        }, 800 + Math.random() * 700);
    }

    if (chatSend) {
        chatSend.addEventListener('click', () => {
            const text = chatInput ? chatInput.value.trim() : "";
            if (text === '') return;
            addMessage(text, 'user');
            if (chatInput) chatInput.value = '';
            botTyping(() => addMessage(botReply(text), 'bot'));
        });
    }

    if (chatInput) {
        chatInput.addEventListener('keypress', e => {
            if (e.key === 'Enter' && chatSend) chatSend.click();
        });
    }

    const chatbotHeader = document.getElementById('chatbot-header');
    if (chatbotHeader && chatBody) {
        chatbotHeader.addEventListener('click', () => {
            chatBody.style.display = chatBody.style.display === 'flex' ? 'none' : 'flex';
        });
    }
});
