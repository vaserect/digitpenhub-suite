/**
 * Digitpen Chatbot Widget
 * Embeddable chat widget for websites
 * Usage: <script src="https://suite.digitpenhub.com/chatbot-widget.js" data-org-id="YOUR_ORG_ID" data-flow-id="YOUR_FLOW_ID"></script>
 */

(function() {
  'use strict';

  // Configuration
  const script = document.currentScript;
  const config = {
    orgId: script.getAttribute('data-org-id'),
    flowId: script.getAttribute('data-flow-id'),
    apiUrl: script.getAttribute('data-api-url') || 'https://suite.digitpenhub.com/api/v1',
    position: script.getAttribute('data-position') || 'bottom-right',
    color: script.getAttribute('data-color') || '#0066FF',
    greeting: script.getAttribute('data-greeting') || 'Hi! How can we help you today?',
  };

  // State
  let isOpen = false;
  let conversationId = null;
  let visitorId = getOrCreateVisitorId();
  let messages = [];
  let currentFlow = null;

  // Get or create visitor ID
  function getOrCreateVisitorId() {
    let id = localStorage.getItem('digitpen_visitor_id');
    if (!id) {
      id = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('digitpen_visitor_id', id);
    }
    return id;
  }

  // Create widget HTML
  function createWidget() {
    const widgetHTML = `
      <div id="digitpen-chatbot" style="
        position: fixed;
        ${config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
        ${config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <!-- Chat Button -->
        <button id="digitpen-chat-button" style="
          width: 60px;
          height: 60px;
          border-radius: 30px;
          background: ${config.color};
          border: none;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        <!-- Chat Window -->
        <div id="digitpen-chat-window" style="
          display: none;
          width: 380px;
          height: 600px;
          max-height: 80vh;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          flex-direction: column;
          overflow: hidden;
          margin-bottom: 10px;
        ">
          <!-- Header -->
          <div style="
            background: ${config.color};
            color: white;
            padding: 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <div style="font-weight: 600; font-size: 16px;">Chat with us</div>
            <button id="digitpen-close-button" style="
              background: none;
              border: none;
              color: white;
              font-size: 24px;
              cursor: pointer;
              padding: 0;
              width: 24px;
              height: 24px;
              line-height: 24px;
            ">×</button>
          </div>

          <!-- Messages -->
          <div id="digitpen-messages" style="
            flex: 1;
            overflow-y: auto;
            padding: 16px;
            background: #f9fafb;
          "></div>

          <!-- Input -->
          <div style="
            padding: 16px;
            border-top: 1px solid #e5e7eb;
            background: white;
          ">
            <div style="display: flex; gap: 8px;">
              <input id="digitpen-input" type="text" placeholder="Type your message..." style="
                flex: 1;
                padding: 10px 12px;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                font-size: 14px;
                outline: none;
              " />
              <button id="digitpen-send-button" style="
                background: ${config.color};
                color: white;
                border: none;
                border-radius: 6px;
                padding: 10px 16px;
                cursor: pointer;
                font-weight: 500;
              ">Send</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', widgetHTML);
    attachEventListeners();
  }

  // Attach event listeners
  function attachEventListeners() {
    const button = document.getElementById('digitpen-chat-button');
    const closeButton = document.getElementById('digitpen-close-button');
    const sendButton = document.getElementById('digitpen-send-button');
    const input = document.getElementById('digitpen-input');

    button.addEventListener('click', toggleChat);
    closeButton.addEventListener('click', toggleChat);
    sendButton.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendMessage();
    });
  }

  // Toggle chat window
  function toggleChat() {
    isOpen = !isOpen;
    const window = document.getElementById('digitpen-chat-window');
    const button = document.getElementById('digitpen-chat-button');
    
    if (isOpen) {
      window.style.display = 'flex';
      button.style.display = 'none';
      if (!conversationId) {
        startConversation();
      }
    } else {
      window.style.display = 'none';
      button.style.display = 'flex';
    }
  }

  // Start conversation
  async function startConversation() {
    try {
      // Identify visitor
      const visitorRes = await fetch(`${config.apiUrl}/chatbot-builder/visitors/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          externalId: visitorId,
          attributes: {
            url: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
          }
        })
      });

      if (!visitorRes.ok) {
        console.error('Failed to identify visitor');
        addMessage('bot', 'Sorry, we are having trouble connecting. Please try again later.');
        return;
      }

      const visitorData = await visitorRes.json();

      // Start conversation
      const convRes = await fetch(`${config.apiUrl}/chatbot-builder/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flowId: config.flowId,
          visitorId: visitorData.visitor.id,
          channel: 'web'
        })
      });

      if (!convRes.ok) {
        console.error('Failed to start conversation');
        addMessage('bot', 'Sorry, we are having trouble connecting. Please try again later.');
        return;
      }

      const convData = await convRes.json();
      conversationId = convData.conversation.id;

      // Load flow
      const flowRes = await fetch(`${config.apiUrl}/chatbot-builder/${config.flowId}`);
      if (flowRes.ok) {
        const flowData = await flowRes.json();
        currentFlow = flowData.flow;
        
        // Send welcome message
        addMessage('bot', currentFlow.welcome_message || config.greeting);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      addMessage('bot', 'Sorry, we are having trouble connecting. Please try again later.');
    }
  }

  // Send message
  async function sendMessage() {
    const input = document.getElementById('digitpen-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    input.value = '';
    addMessage('user', message);

    if (!conversationId) {
      addMessage('bot', 'Please wait while we connect you...');
      await startConversation();
      return;
    }

    try {
      // Save user message
      await fetch(`${config.apiUrl}/chatbot-builder/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          nodeId: null,
          content: message
        })
      });

      // Process response (simplified - would need full node processing logic)
      // For now, just echo back or use AI
      setTimeout(() => {
        addMessage('bot', 'Thank you for your message. Our team will respond shortly.');
      }, 500);

    } catch (error) {
      console.error('Error sending message:', error);
      addMessage('bot', 'Sorry, there was an error sending your message. Please try again.');
    }
  }

  // Add message to chat
  function addMessage(sender, content) {
    const messagesDiv = document.getElementById('digitpen-messages');
    const isBot = sender === 'bot';
    
    const messageHTML = `
      <div style="
        display: flex;
        justify-content: ${isBot ? 'flex-start' : 'flex-end'};
        margin-bottom: 12px;
      ">
        <div style="
          max-width: 70%;
          padding: 10px 14px;
          border-radius: 12px;
          background: ${isBot ? '#e5e7eb' : config.color};
          color: ${isBot ? '#1f2937' : 'white'};
          font-size: 14px;
          line-height: 1.5;
        ">${escapeHtml(content)}</div>
      </div>
    `;
    
    messagesDiv.insertAdjacentHTML('beforeend', messageHTML);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
    
    messages.push({ sender, content, timestamp: new Date() });
  }

  // Escape HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Initialize widget when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createWidget);
  } else {
    createWidget();
  }

  // Expose API
  window.DigitpenChatbot = {
    open: () => { if (!isOpen) toggleChat(); },
    close: () => { if (isOpen) toggleChat(); },
    sendMessage: (msg) => {
      document.getElementById('digitpen-input').value = msg;
      sendMessage();
    }
  };

})();
