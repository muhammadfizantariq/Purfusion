// chatbot.js
document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element Connections ---
    const toggleButton = document.getElementById('chatbot-toggle');
    const closeButton = document.getElementById('chatbot-close');
    const chatbotWidget = document.getElementById('chatbot-widget');
    const messagesContainer = document.getElementById('chatbot-messages');
    const inputField = document.getElementById('chatbot-input');
    const sendButton = document.getElementById('chatbot-send');

    // --- State management ---
    let isChatStarted = false;
    let conversationState = 'idle';
    let currentLead = {};
    let conversationHistory = [];
    let currentServiceContext = null; // NEW: Track which service the user is interested in
    let savedContactInfo = null; // NEW: Store contact info across conversations
    let savedLocation = null; // NEW: Store location across conversations

    // --- Complete Chatbot Data Structure ---
    const botResponses = {
        greeting: {
            message: "👋 Hi there! Welcome to ProFusion General Contractor – your local experts in restoration, roofing, remodeling, hardscaping, and more!\n\nHow can we help you today?",
            buttons: [
                { text: '🏠 Roofing', payload: 'roofing' },
                { text: '🔨 Remodeling', payload: 'remodeling' },
                { text: '🔧 Restoration Services', payload: 'restoration' },
                { text: '🧱 Hardscaping & Outdoor', payload: 'hardscaping' },
                { text: '☀️ Solar Services', payload: 'solar' },
                { text: '📞 Contact a Pro', payload: 'contact_general' },
                { text: '📅 Schedule a Free Estimate', payload: 'schedule_estimate_general' },
                { text: '❓ FAQs', payload: 'faq_start' }
            ]
        },
        roofing: {
            message: "Our roofing team specializes in residential and commercial roofing — from minor repairs to full replacements. We work with top-quality materials and offer storm damage inspections, too.",
            buttons: [
                { text: '1️⃣ Schedule a FREE inspection', payload: 'schedule_estimate_roofing' },
                { text: '2️⃣ Learn more about roofing', payload: 'learn_roofing' },
                { text: '3️⃣ Speak to a roofing expert', payload: 'contact_roofing' },
                { text: '4️⃣ See recent projects', payload: 'show_projects' }
            ]
        },
        remodeling: {
            message: "Looking to upgrade your home? We offer kitchen, bathroom, and full home remodeling. Our experienced team handles everything from design to build.",
            buttons: [
                { text: '1️⃣ Request a remodeling quote', payload: 'schedule_estimate_remodeling' },
                { text: '2️⃣ Learn more about our process', payload: 'learn_remodeling' },
                { text: '3️⃣ Speak to our remodeling team', payload: 'contact_remodeling' },
                { text: '4️⃣ See project examples', payload: 'show_projects' }
            ]
        },
        restoration: {
            message: "Dealing with water, fire, or storm damage? We're ready to help 24/7. Our restoration crew acts fast to prevent further damage and begin cleanup and repair.",
            buttons: [
                { text: '1️⃣ Get emergency help', payload: 'contact_restoration' },
                { text: '2️⃣ Learn our restoration process', payload: 'learn_restoration' },
                { text: '3️⃣ Speak to a restoration expert', payload: 'contact_restoration' },
                { text: '4️⃣ See recent projects', payload: 'show_projects' }
            ]
        },
        hardscaping: {
            message: "Dreaming of a better outdoor space? We design and build patios, walkways, retaining walls, and more — combining function and style.",
            buttons: [
                { text: '1️⃣ Get a free design consult', payload: 'schedule_estimate_hardscaping' },
                { text: '2️⃣ Learn more about hardscaping', payload: 'learn_hardscaping' },
                { text: '3️⃣ Speak with a hardscape pro', payload: 'contact_hardscaping' },
                { text: '4️⃣ View our hardscape gallery', payload: 'show_projects' }
            ]
        },
        solar: {
            message: "Looking to go solar? We provide complete solar solutions — from custom system design and installation to energy savings consultations.",
            buttons: [
                { text: '1️⃣ Schedule a FREE consultation', payload: 'schedule_estimate_solar' },
                { text: '2️⃣ Learn about solar savings', payload: 'learn_solar' },
                { text: '3️⃣ Speak with a solar expert', payload: 'contact_solar' },
                { text: '4️⃣ See recent projects', payload: 'show_projects' }
            ]
        },
        fallback: {
            message: "Sorry, I didn't understand that. Please choose one of the options below, or type 'menu' to see the main options again.",
            buttons: [{ text: '🏠 Main Menu', payload: 'menu' }]
        },

        learn_solar: {
            message: "We use high-efficiency panels and tailor every system to your home or business. Whether you're reducing your energy bill or going green, we'll walk you through it step by step.",
            buttons: [{ text: '📅 Schedule a FREE Solar Consultation', payload: 'schedule_estimate_solar' }, { text: '⬅️ Back to Solar Options', payload: 'solar' }]
        },
        learn_roofing: {
            message: "We install asphalt shingles, metal roofing, and flat roofs for both residential and commercial properties. We also work directly with insurance companies for storm damage claims to simplify the process for you.",
            buttons: [{ text: '📅 Schedule a FREE Roof Inspection', payload: 'schedule_estimate_roofing' }, { text: '⬅️ Back to Roofing Options', payload: 'roofing' }]
        },
        learn_restoration: {
            message: "Our restoration process starts with a rapid response to secure your property and prevent further damage. We then handle water extraction, drying, cleaning, and finally, full repair and reconstruction to get your property back to its original state.",
            buttons: [{ text: '📞 Get Emergency Help', payload: 'contact_restoration' }, { text: '⬅️ Back to Restoration Options', payload: 'restoration' }]
        },
        learn_hardscaping: {
            message: "We build beautiful and functional patios, walkways, retaining walls, fire pits, and outdoor kitchens. We use high-quality pavers, flagstone, and natural stone to match your home's style and offer custom 2D/3D design concepts so you can visualize the project first.",
            buttons: [{ text: '📅 Get a Free Design Consult', payload: 'schedule_estimate_hardscaping' }, { text: '⬅️ Back to Hardscaping Options', payload: 'hardscaping' }]
        },
        learn_remodeling: {
            message: "Our team helps you plan and design your new kitchen, bathroom, or addition to fit your goals and budget. We handle everything from the initial concept and material selection to construction and the final cleanup, ensuring a smooth process.",
            buttons: [{ text: '📅 Request a Remodeling Quote', payload: 'schedule_estimate_remodeling' }, { text: '⬅️ Back to Remodeling Options', payload: 'remodeling' }]
        },
        show_projects: {
            message: "You can see examples of our recent work on the 'Recent Projects' section of our website!",
            buttons: [{ text: '⬅️ Back to Main Menu', payload: 'menu' }]
        },
        // NEW: Service-specific lead capture messages
        ask_contact_info: {
            message: "Got it. What's the best email address or phone number to reach you at?",
            buttons: []
        },
        ask_location: {
            message: "Perfect. And finally, where in the DFW area is the project located?",
            buttons: []
        },
        ask_project_details_roofing: {
            message: "Perfect! I'll connect you with our roofing team. What specific roofing details can you share about your project (e.g., repair, replacement, storm damage, etc.)?",
            buttons: []
        },
        ask_project_details_remodeling: {
            message: "Great! I'll connect you with our remodeling team. What type of remodeling project are you planning (e.g., kitchen, bathroom, full home renovation, etc.)?",
            buttons: []
        },
        ask_project_details_restoration: {
            message: "I'll connect you with our restoration team right away. What type of damage are you dealing with (e.g., water, fire, storm damage, mold, etc.)?",
            buttons: []
        },
        ask_project_details_hardscaping: {
            message: "Excellent! I'll connect you with our hardscaping team. What outdoor project are you envisioning (e.g., patio, walkway, retaining wall, outdoor kitchen, etc.)?",
            buttons: []
        },
        ask_project_details_solar: {
            message: "Perfect! I'll connect you with our solar team. What's your main goal with solar (e.g., reduce electric bill, increase home value, go green, etc.)?",
            buttons: []
        },
        ask_project_details_general: {
            message: "Great, I can help with that. First, what type of project are you planning (e.g., roofing, remodeling, solar, hardscaping, restoration)?",
            buttons: []
        },
        lead_capture_confirm: {
            message: "✅ Thank you! All the details have been recorded. A member of our team will contact you shortly. If you want to take a look at our other services too, please click on the icon below:",
            buttons: [{ text: '🏠 Back to Main Menu', payload: 'menu' }]
        },
        lead_capture_confirm_returning: {
            message: "✅ Perfect! We've added your new project details to your information. Our team will contact you about this additional service shortly. Feel free to explore more services:",
            buttons: [{ text: '🏠 Back to Main Menu', payload: 'menu' }]
        },
        lead_capture_invalid_contact: {
            message: "Hmm, that doesn't look like a valid phone number or email. Could you please try again?",
            buttons: []
        },
        // FAQ responses remain the same...
        faq_start: {
            message: "I can help with that. What category is your question about?",
            buttons: [
                { text: '🔨 General', payload: 'faq_general' },
                { text: '🏠 Roofing', payload: 'faq_roofing' },
                { text: '🔧 Restoration', payload: 'faq_restoration' },
                { text: '☀️ Solar', payload: 'faq_solar' },
                { text: '⬅️ Back to Menu', payload: 'menu' }
            ]
        },
        faq_general: {
            message: "Here are some general questions. Select one to see the answer.",
            buttons: [
                { text: 'Are you licensed and insured?', payload: 'faq_answer_licensed' },
                { text: 'Do you offer free estimates?', payload: 'faq_answer_estimates' },
                { text: 'What areas do you serve?', payload: 'faq_answer_areas' },
                { text: 'Do you offer financing?', payload: 'faq_answer_financing' },
                { text: '⬅️ Back to Categories', payload: 'faq_start' }
            ]
        },
        faq_roofing: {
            message: "Here are some roofing questions. Select one to see the answer.",
            buttons: [
                { text: 'What types of roofing do you install?', payload: 'faq_answer_roof_types' },
                { text: 'Do you work with insurance claims?', payload: 'faq_answer_insurance' },
                { text: 'Repair or full replacement?', payload: 'faq_answer_repair_replace' },
                { text: '⬅️ Back to Categories', payload: 'faq_start' }
            ]
        },
        faq_restoration: {
            message: "Here are some restoration questions. Select one to see the answer.",
            buttons: [
                { text: 'What types of restoration do you offer?', payload: 'faq_answer_resto_types' },
                { text: 'Is emergency service available?', payload: 'faq_answer_emergency' },
                { text: 'How long does restoration take?', payload: 'faq_answer_resto_time' },
                { text: '⬅️ Back to Categories', payload: 'faq_start' }
            ]
        },
        faq_solar: {
            message: "Here are some solar questions. Select one to see the answer.",
            buttons: [
                { text: 'Why should I go solar with ProFusion?', payload: 'faq_answer_why_solar' },
                { text: 'Do you offer solar financing?', payload: 'faq_answer_solar_financing' },
                { text: 'Do you handle permits and inspections?', payload: 'faq_answer_permits' },
                { text: '⬅️ Back to Categories', payload: 'faq_start' }
            ]
        },
        faq_answer_licensed: {
            message: "Yes! ProFusion is fully licensed and insured to operate in the DFW Metroplex. We meet or exceed all state and local requirements to ensure your project is safe and protected.",
            buttons: [{ text: '⬅️ Back to General Questions', payload: 'faq_general' }]
        },
        faq_answer_estimates: {
            message: "Absolutely. We offer 100% free, no-obligation estimates for all services.",
            buttons: [{ text: '⬅️ Back to General Questions', payload: 'faq_general' }]
        },
        faq_answer_areas: {
            message: "We proudly serve the entire Dallas–Fort Worth (DFW) Metroplex and surrounding communities.",
            buttons: [{ text: '⬅️ Back to General Questions', payload: 'faq_general' }]
        },
        faq_answer_financing: {
            message: "Yes! We have flexible financing options available for qualifying roofing, solar, and remodeling projects. Ask us for details during your estimate.",
            buttons: [{ text: '⬅️ Back to General Questions', payload: 'faq_general' }]
        },
        faq_answer_roof_types: {
            message: "We install asphalt shingles, metal roofing, flat roofs, and more — for both residential and commercial properties. We'll help you choose the best material for your needs and budget.",
            buttons: [{ text: '⬅️ Back to Roofing Questions', payload: 'faq_roofing' }]
        },
        faq_answer_insurance: {
            message: "Yes, we work directly with your insurance company to simplify the claims process after hail, wind, or storm damage.",
            buttons: [{ text: '⬅️ Back to Roofing Questions', payload: 'faq_roofing' }]
        },
        faq_answer_repair_replace: {
            message: "A free inspection can determine that. Minor issues may only need repairs, while extensive damage or an aging roof may require a replacement. We'll give you an honest assessment.",
            buttons: [{ text: '⬅️ Back to Roofing Questions', payload: 'faq_roofing' }]
        },
        faq_answer_resto_types: {
            message: "We specialize in water damage, fire damage, storm damage, and mold remediation. We respond quickly to limit further damage and begin the cleanup and rebuild process.",
            buttons: [{ text: '⬅️ Back to Restoration Questions', payload: 'faq_restoration' }]
        },
        faq_answer_emergency: {
            message: "Yes, we try our best to respond in a timely manner, usually within 4 hours for emergencies.",
            buttons: [{ text: '⬅️ Back to Restoration Questions', payload: 'faq_restoration' }]
        },
        faq_answer_resto_time: {
            message: "It depends on the severity of the damage. We'll give you a timeline after inspection, but our goal is always to restore your property quickly, safely, and correctly.",
            buttons: [{ text: '⬅️ Back to Restoration Questions', payload: 'faq_restoration' }]
        },
        faq_answer_why_solar: {
            message: "We design custom solar systems using high-efficiency panels and quality installation. Going solar helps reduce your electric bill and increase your home's value.",
            buttons: [{ text: '⬅️ Back to Solar Questions', payload: 'faq_solar' }]
        },
        faq_answer_solar_financing: {
            message: "Yes, we offer financing and help you take advantage of available federal tax credits and local utility rebates where applicable.",
            buttons: [{ text: '⬅️ Back to Solar Questions', payload: 'faq_solar' }]
        },
        faq_answer_permits: {
            message: "Yes, we handle everything from start to finish — design, permitting, installation, inspection, and utility hookup.",
            buttons: [{ text: '⬅️ Back to Solar Questions', payload: 'faq_solar' }]
        }
    };

    // NEW: Service context mapping
    const serviceContextMap = {
        'roofing': 'Roofing',
        'remodeling': 'Remodeling',
        'restoration': 'Restoration',
        'hardscaping': 'Hardscaping',
        'solar': 'Solar'
    };

    // --- State & History Management ---
    function addToHistory(speaker, text) {
        conversationHistory.push({ speaker, text, timestamp: new Date().toISOString() });
    }

    // --- UI & Event Listener Functions ---
    const toggleChatbot = () => {
        const isHidden = chatbotWidget.classList.contains('chatbot-hidden');
        chatbotWidget.classList.toggle('chatbot-hidden');
        if (isHidden && !isChatStarted) {
            startChat();
        }
    };

    const handleUserInput = () => {
        const messageText = inputField.value.trim();
        if (messageText) {
            displayMessage(messageText, 'user');
            addToHistory('user', messageText);
            processUserMessage(messageText);
            inputField.value = '';
        }
    };

    toggleButton.addEventListener('click', toggleChatbot);
    closeButton.addEventListener('click', () => chatbotWidget.classList.add('chatbot-hidden'));
    sendButton.addEventListener('click', handleUserInput);
    inputField.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleUserInput();
        }
    });

    // --- Message Display & UI Helpers ---
    function displayMessage(text, sender) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message ${sender}-message`;
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.innerHTML = `<img src="chatbot.png" alt="${sender}" />`;
        const content = document.createElement('div');
        content.className = 'message-content';
        content.innerHTML = `<p>${text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')}</p>`;
        messageWrapper.appendChild(avatar);
        messageWrapper.appendChild(content);
        messagesContainer.appendChild(messageWrapper);
        scrollToBottom();
    }

    function displayButtons(buttons) {
        if (!buttons || buttons.length === 0) return;
        const buttonsContainer = document.createElement('div');
        buttonsContainer.className = 'chatbot-buttons';
        buttons.forEach(buttonInfo => {
            const button = document.createElement('button');
            button.className = 'chatbot-button';
            button.textContent = buttonInfo.text;
            button.addEventListener('click', () => {
                displayMessage(buttonInfo.text, 'user');
                addToHistory('user', buttonInfo.text);
                processUserMessage(buttonInfo.payload);
            });
            buttonsContainer.appendChild(button);
        });
        messagesContainer.appendChild(buttonsContainer);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const typingIndicator = document.createElement('div');
        typingIndicator.className = 'message bot-message typing-indicator';
        typingIndicator.innerHTML = `<div class="message-avatar"><img src="chatbot.png" alt="bot" /></div><div class="message-content"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>`;
        messagesContainer.appendChild(typingIndicator);
        scrollToBottom();
        return typingIndicator;
    }

    function scrollToBottom() {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // --- Core Logic Functions ---
    function startChat() {
        isChatStarted = true;
        addToHistory('system', 'Chat session started.');
        const typing = showTypingIndicator();
        setTimeout(() => {
            messagesContainer.removeChild(typing);
            const initialResponse = botResponses.greeting;
            addToHistory('bot', botResponses.greeting.message);
            displayButtons(initialResponse.buttons);
        }, 1000);
    }

    function processUserMessage(userInput) {
        if (conversationState.startsWith('awaiting_')) {
            handleLeadCapture(userInput);
            return;
        }

        const typing = showTypingIndicator();
        let response;
        const lowerCaseInput = userInput.toLowerCase().trim();

        setTimeout(() => {
            messagesContainer.removeChild(typing);

            // NEW: Handle service-specific contact and estimate requests
            if (lowerCaseInput.includes('contact_') || lowerCaseInput.includes('schedule_estimate_')) {
                const service = extractServiceFromPayload(lowerCaseInput);
                startLeadCaptureFlow('Contact', service);
                return;
            }

            // Handle general contact and estimate requests
            if (lowerCaseInput === 'contact_general' || lowerCaseInput === 'schedule_estimate_general') {
                startLeadCaptureFlow('Contact', null);
                return;
            }

            // Set service context when user selects a service
            if (['roofing', 'remodeling', 'restoration', 'hardscaping', 'solar'].includes(lowerCaseInput)) {
                currentServiceContext = lowerCaseInput;
            }

            // Handle FAQ responses
            if (lowerCaseInput.startsWith('faq_')) {
                response = botResponses[lowerCaseInput];
            }
            // Handle learn more responses
            else if (lowerCaseInput.startsWith('learn_')) {
                response = botResponses[lowerCaseInput];
            }
            // Handle show projects
            else if (lowerCaseInput === 'show_projects') {
                response = botResponses.show_projects;
            }
            // Handle service selections
            else if (['roofing', 'remodeling', 'restoration', 'hardscaping', 'solar'].includes(lowerCaseInput)) {
                response = botResponses[lowerCaseInput];
            }
            // Handle menu
            else if (lowerCaseInput === 'menu') {
                currentServiceContext = null; // Reset context when going back to menu
                response = botResponses.greeting;
            }
            // Handle keyword matching for natural language input
            else if (lowerCaseInput.includes('roof')) {
                currentServiceContext = 'roofing';
                response = botResponses.roofing;
            }
            else if (lowerCaseInput.includes('remodel')) {
                currentServiceContext = 'remodeling';
                response = botResponses.remodeling;
            }
            else if (lowerCaseInput.includes('restoration') || lowerCaseInput.includes('damage')) {
                currentServiceContext = 'restoration';
                response = botResponses.restoration;
            }
            else if (lowerCaseInput.includes('hardscap') || lowerCaseInput.includes('outdoor')) {
                currentServiceContext = 'hardscaping';
                response = botResponses.hardscaping;
            }
            else if (lowerCaseInput.includes('solar')) {
                currentServiceContext = 'solar';
                response = botResponses.solar;
            }
            else if (lowerCaseInput.includes('estim') || lowerCaseInput.includes('quote')) {
                startLeadCaptureFlow('Estimate', currentServiceContext);
                return;
            }
            else if (lowerCaseInput.includes('contact')) {
                startLeadCaptureFlow('Contact', currentServiceContext);
                return;
            }
            else {
                response = botResponses.fallback;
            }

            displayAndLogBotMessage(response.message, response.buttons);
        }, 1200);
    }

    // NEW: Extract service from payload
    function extractServiceFromPayload(payload) {
        if (payload.includes('roofing')) return 'roofing';
        if (payload.includes('remodeling')) return 'remodeling';
        if (payload.includes('restoration')) return 'restoration';
        if (payload.includes('hardscaping')) return 'hardscaping';
        if (payload.includes('solar')) return 'solar';
        return null;
    }

    // UPDATED: Start lead capture with service context and saved info
    function startLeadCaptureFlow(leadType, serviceContext = null) {
        currentLead = { 
            leadType: leadType,
            serviceContext: serviceContext || currentServiceContext
        };
        
        // Check if we already have contact info and location from previous interactions
        if (savedContactInfo && savedLocation) {
            // User already provided contact info and location, just get project details
            conversationState = 'awaiting_project_details';
            currentLead.contactInfo = savedContactInfo;
            currentLead.location = savedLocation;
            
            // Choose the appropriate message based on service context
            let messageKey;
            if (currentLead.serviceContext) {
                messageKey = `ask_project_details_${currentLead.serviceContext}`;
                // Pre-populate the project type
                currentLead.projectType = serviceContextMap[currentLead.serviceContext];
            } else {
                messageKey = 'ask_project_details_general';
            }
            
            displayAndLogBotMessage(botResponses[messageKey].message);
        } else {
            // First time user, start with project details
            conversationState = 'awaiting_project_details';
            
            // Choose the appropriate message based on service context
            let messageKey;
            if (currentLead.serviceContext) {
                messageKey = `ask_project_details_${currentLead.serviceContext}`;
                // Pre-populate the project type
                currentLead.projectType = serviceContextMap[currentLead.serviceContext];
            } else {
                messageKey = 'ask_project_details_general';
            }
            
            displayAndLogBotMessage(botResponses[messageKey].message);
        }
    }

    // UPDATED: Handle lead capture with better flow and saved info
    function handleLeadCapture(userInput) {
        const typing = showTypingIndicator();
        setTimeout(() => {
            messagesContainer.removeChild(typing);
            switch (conversationState) {
                case 'awaiting_project_details':
                    currentLead.projectDetails = userInput;
                    // If we don't have a service context, this input becomes the project type
                    if (!currentLead.serviceContext) {
                        currentLead.projectType = userInput;
                    }
                    
                    // Check if we already have contact info saved
                    if (savedContactInfo) {
                        // Skip contact info, go to location or finish
                        currentLead.contactInfo = savedContactInfo;
                        if (savedLocation) {
                            // We have everything, save and finish
                            currentLead.location = savedLocation;
                            saveLeadToDatabase();
                            const confirmResponse = savedContactInfo ? botResponses.lead_capture_confirm_returning : botResponses.lead_capture_confirm;
                            displayAndLogBotMessage(confirmResponse.message, confirmResponse.buttons);
                            conversationState = 'idle';
                            currentLead = {};
                            currentServiceContext = null;
                        } else {
                            // Need location only
                            conversationState = 'awaiting_location';
                            displayAndLogBotMessage(botResponses.ask_location.message);
                        }
                    } else {
                        // Need contact info
                        conversationState = 'awaiting_contact_info';
                        displayAndLogBotMessage(botResponses.ask_contact_info.message);
                    }
                    break;
                case 'awaiting_contact_info':
                    if (validateContact(userInput)) {
                        currentLead.contactInfo = userInput;
                        savedContactInfo = userInput; // Save for future use
                        
                        if (savedLocation) {
                            // We already have location, finish up
                            currentLead.location = savedLocation;
                            saveLeadToDatabase();
                            const confirmResponse = botResponses.lead_capture_confirm_returning;
                            displayAndLogBotMessage(confirmResponse.message, confirmResponse.buttons);
                            conversationState = 'idle';
                            currentLead = {};
                            currentServiceContext = null;
                        } else {
                            // Need location
                            conversationState = 'awaiting_location';
                            displayAndLogBotMessage(botResponses.ask_location.message);
                        }
                    } else {
                        displayAndLogBotMessage(botResponses.lead_capture_invalid_contact.message);
                    }
                    break;
                case 'awaiting_location':
                    currentLead.location = userInput;
                    savedLocation = userInput; // Save for future use
                    saveLeadToDatabase();
                    const confirmResponse = botResponses.lead_capture_confirm;
                    displayAndLogBotMessage(confirmResponse.message, confirmResponse.buttons);
                    conversationState = 'idle';
                    currentLead = {};
                    currentServiceContext = null; // Reset context
                    break;
            }
        }, 1000);
    }

    function displayAndLogBotMessage(message, buttons = []) {
        displayMessage(message, 'bot');
        addToHistory('bot', message);
        if (buttons && buttons.length > 0) {
            displayButtons(buttons);
        }
    }

    async function saveLeadToDatabase() {
        const leadData = { 
            ...currentLead, 
            fullConversation: conversationHistory,
            services: currentLead.services || [] // Track multiple services
        };
        
        // If this is a returning user, add service to existing lead
        if (savedContactInfo) {
            leadData.services.push({
                serviceContext: currentLead.serviceContext,
                projectType: currentLead.projectType,
                projectDetails: currentLead.projectDetails,
                timestamp: new Date().toISOString()
            });
        }
        
        try {
            const response = await fetch('http://localhost:3000/api/save-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });
            const result = await response.json();
            if (result.success) {
                console.log("Structured lead successfully sent to server.");
            } else {
                console.error("Failed to save lead:", result.message);
            }
        } catch (error) {
            console.error('Error sending lead data to server:', error);
        }
    }

    function validateContact(input) {
        const emailRegex = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
        const phoneRegex = /(\+\d{1,3}[- ]?)?\(?(\d{3})\)?[- ]?(\d{3})[- ]?(\d{4})/g;
        return emailRegex.test(input) || phoneRegex.test(input);
    }
});