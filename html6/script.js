document.addEventListener('DOMContentLoaded', () => {
    // -------------------- User System --------------------
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

    function saveUsers() { localStorage.setItem('users', JSON.stringify(users)); }
    function saveCurrentUser() { localStorage.setItem('currentUser', JSON.stringify(currentUser)); }

    function showLogin() {
        document.getElementById('login').style.display = 'flex';
        document.getElementById('user-panel').style.display = 'none';
    }

    function showUserPanel() {
        document.getElementById('login').style.display = 'none';
        document.getElementById('user-panel').style.display = 'flex';
        document.getElementById('user-name').textContent = currentUser.username;
    }

    // Display correct panel on page load
    if(currentUser) showUserPanel();
    else showLogin();

    // Login form
    document.getElementById('login').addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const user = users.find(u => u.username === username && u.password === password);
        if(user){
            currentUser = user;
            saveCurrentUser();
            showUserPanel();
        } else {
            alert('Invalid username or password');
        }
    });

    // Register form
    document.getElementById('register').addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        if(users.find(u=>u.username===username)){ 
            alert('Username already exists'); 
        } else { 
            const newUser = {username, password};
            users.push(newUser); 
            saveUsers(); 
            alert('Registered successfully'); 
            document.getElementById('register').reset(); 
        }
    });

    // Logout
    document.getElementById('logout').addEventListener('click', () => {
        currentUser = null;
        saveCurrentUser();
        showLogin();
    });

    // Delete account
    document.getElementById('delete-account').addEventListener('click', () => { 
        if(confirm('Are you sure you want to delete your account?')) { 
            users = users.filter(u => u.username !== currentUser.username); 
            saveUsers(); 
            currentUser = null; 
            saveCurrentUser();
            showLogin(); 
        } 
    });

    // -------------------- Chatbot --------------------
    const chatMessages = document.getElementById('chatbot-messages');
    const chatInput = document.getElementById('chatbot-input');
    const chatSend = document.getElementById('chatbot-send');
    const chatBody = document.getElementById('chatbot-body');

    // Load previous chat from localStorage
    let conversationHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    conversationHistory.forEach(msg => addMessage(msg.message, msg.sender));

    function addMessage(message, sender='user'){
        const msgDiv = document.createElement('div');
        msgDiv.className = sender==='user' ? 'chat-msg user-msg' : 'chat-msg bot-msg';
        msgDiv.textContent = message;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        conversationHistory.push({sender,message});
        if(conversationHistory.length > 50) conversationHistory.shift(); // keep last 50 messages
        localStorage.setItem('chatHistory', JSON.stringify(conversationHistory));
    }

    function botReply(userText){
        const text = userText.toLowerCase().trim();
        if(/hello|hi|hey/.test(text)) return "Hello! How can I assist you today?";
        if(/services/.test(text)) return "We offer Web Development, Design Consulting, SEO Optimization, and Customer Support.";
        if(/contact|email|phone/.test(text)) return "You can reach us at info@mywebsite.com or call (123) 456-7890.";
        if(/about/.test(text)) return "We are a dedicated team providing high-quality services. Our mission is to deliver excellence!";
        if(/register|sign up/.test(text)) return "You can register using the form in the Register section.";
        if(/time/.test(text)) return `Current time is ${new Date().toLocaleTimeString()}`;
        if(/date/.test(text)) return `Today's date is ${new Date().toLocaleDateString()}`;
        return "I'm sorry, I don't fully understand. Can you rephrase your question?";
    }

    function botTyping(callback){
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

    chatSend.addEventListener('click', ()=>{
        const text = chatInput.value.trim();
        if(text==='') return;
        addMessage(text,'user');
        chatInput.value = '';

        botTyping(()=> addMessage(botReply(text),'bot'));
    });

    chatInput.addEventListener('keypress', e=>{ if(e.key==='Enter') chatSend.click(); });

    // Toggle chatbot
    document.getElementById('chatbot-header').addEventListener('click', ()=>{
        chatBody.style.display = chatBody.style.display==='flex' ? 'none' : 'flex';
    });
});
