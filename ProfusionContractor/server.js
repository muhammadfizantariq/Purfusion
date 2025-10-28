// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// --- Connect to MongoDB ---
// Use environment variable for MongoDB URI
const mongoURI = process.env.MONGODB_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB Connected...'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// --- Define a structured Schema for Leads ---
const leadSchema = new mongoose.Schema({
    leadType: { type: String, required: true }, // 'Estimate' or 'Contact'
    serviceContext: { type: String }, // Track which service (roofing, hardscaping, etc.)
    projectType: { type: String },
    projectDetails: { type: String }, // Store specific project details
    contactInfo: { type: String },
    location: { type: String },
    services: [{ // NEW: Array to track multiple services
        serviceContext: String,
        projectType: String,
        projectDetails: String,
        timestamp: { type: Date, default: Date.now }
    }],
    fullConversation: [Object], // Store the whole conversation transcript
    timestamp: { type: Date, default: Date.now },
    lastUpdated: { type: Date, default: Date.now } // Track when last updated
});

const Lead = mongoose.model('Lead', leadSchema);

// --- API Endpoint to Save a Structured Lead ---
app.post('/api/save-lead', async (req, res) => {
    try {
        const { leadType, serviceContext, projectType, projectDetails, contactInfo, location, services, fullConversation } = req.body;

        if (!leadType || !fullConversation || !contactInfo) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        // Check if a lead with this contact info already exists
        const existingLead = await Lead.findOne({ contactInfo: contactInfo });

        if (existingLead) {
            // Update existing lead with new service and APPEND conversation
            existingLead.services = existingLead.services || [];
            existingLead.services.push({
                serviceContext: serviceContext,
                projectType: projectType,
                projectDetails: projectDetails,
                timestamp: new Date()
            });
            
            // Update top-level fields with comma-separated values
            // Add leadType if it's different and not already included
            if (leadType && !existingLead.leadType.includes(leadType)) {
                existingLead.leadType = existingLead.leadType + ', ' + leadType;
            }
            
            // Add serviceContext if it exists and not already included
            if (serviceContext) {
                if (existingLead.serviceContext) {
                    if (!existingLead.serviceContext.includes(serviceContext)) {
                        existingLead.serviceContext = existingLead.serviceContext + ', ' + serviceContext;
                    }
                } else {
                    existingLead.serviceContext = serviceContext;
                }
            }
            
            // Add projectType if it exists and not already included
            if (projectType) {
                if (existingLead.projectType) {
                    if (!existingLead.projectType.includes(projectType)) {
                        existingLead.projectType = existingLead.projectType + ', ' + projectType;
                    }
                } else {
                    existingLead.projectType = projectType;
                }
            }
            
            // Add projectDetails if it exists and not already included
            if (projectDetails) {
                if (existingLead.projectDetails) {
                    if (!existingLead.projectDetails.includes(projectDetails)) {
                        existingLead.projectDetails = existingLead.projectDetails + ', ' + projectDetails;
                    }
                } else {
                    existingLead.projectDetails = projectDetails;
                }
            }
            
            // APPEND new conversation to existing conversation history
            // Add a separator to distinguish between different browser sessions
            existingLead.fullConversation.push({
                speaker: 'system',
                text: `--- New conversation session started at ${new Date().toISOString()} ---`,
                timestamp: new Date().toISOString()
            });
            
            // Append all new conversation messages
            existingLead.fullConversation = existingLead.fullConversation.concat(fullConversation);
            
            existingLead.lastUpdated = new Date();
            
            await existingLead.save();
            console.log('Updated existing lead with new service and appended conversation:', existingLead);
            res.status(200).json({ success: true, message: 'Lead updated successfully with new service.' });
        } else {
            // Create new lead
            const newLead = new Lead({
                leadType,
                serviceContext,
                projectType,
                projectDetails,
                contactInfo,
                location,
                services: services || [{
                    serviceContext: serviceContext,
                    projectType: projectType,
                    projectDetails: projectDetails,
                    timestamp: new Date()
                }],
                fullConversation
            });

            await newLead.save();
            console.log('New lead saved successfully:', newLead);
            res.status(200).json({ success: true, message: 'Lead saved successfully.' });
        }
    } catch (error) {
        console.error('Error saving lead:', error);
        res.status(500).json({ success: false, message: 'Server error.' });
    }
});

// Use environment variable for PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});