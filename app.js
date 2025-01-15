// Import the required modules
const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

// Create an Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Use bodyParser to parse JSON request bodies
app.use(bodyParser.json());

// Use the HubSpot access token from environment variable (Set in GitHub Secrets)
const hubspotAccessToken = process.env.HUBSPOT_ACCESS_TOKEN;

if (!hubspotAccessToken) {
  console.error('HUBSPOT_ACCESS_TOKEN is not set in the environment.');
  process.exit(1);  // Exit if the access token is missing
}

// HubSpot API URL for creating a deal
const HUBSPOT_API_URL = 'https://api.hubapi.com/crm/v3/objects/deals';

// Mapping of status values to deal stage IDs
const statusToDealStageMap = {
  "Post CX": "254026343",
  "DOOR HANG": "980657720",
  "Language Barrier": "995756127",
  "BLACK FLAG": "995739908",
  "NO INTEREST": "980657726",
  "Go Back": "980657722",
  "Call Back": "254085672",
  "SNOWBIRD": "995757939",
  "VACANT LOT": "995757938",
  "VACANT Home/SALE": "995757938",
  "Customer": "254085676",
  "ORDER/SALE": "980657723",
  "MDU/POA": "995750050",
  "Business": "254085679",
  "Not Home/No Answer": "981960760",
  "Interested": "980657721"
};

// Main route to handle incoming webhook requests
app.post('/webhook', async (req, res) => {
  try {
    // Extract the lead data from the request body
    const leadData = req.body.leadData || {};
    
    // Extract fields from leadData (using fallbacks for missing values)
    const city = leadData.city || 'Unknown City';
    const state = leadData.state || 'Unknown State';
    const postalCode = leadData.postalCode || '00000';
    const street1 = leadData.street1 || 'Unknown Street';
    const status = leadData.status || 'Unknown Status';
    const leadId = leadData.leadId || 'Unknown Lead ID';
    const latitude = leadData.latitude || 'Unknown Latitude';
    const longitude = leadData.longitude || 'Unknown Longitude';
    const sales_rep = leadData.userId || 'Unknown userId';
    const firstName = leadData.firstName || 'Unknown First Name';
    const lastName = leadData.lastName || 'Unknown Last Name';
    const email = leadData.email || 'Unknown Last email';

    // Get the corresponding deal stage ID based on the status field
    const dealStageId = statusToDealStageMap[status] || "254026343"; // Default to Post CX if status is not found

    // Build the full address for the deal name
    const fullAddress = `${street1}, ${city}, ${state} ${postalCode}`;

    // Define the deal data to be sent to HubSpot
    const dealData = {
      "properties": {
        "dealname": fullAddress,  // Set deal name as the full address
        "pipeline": "668449138",  // Replace with your actual pipeline ID
        "dealstage": dealStageId,  // Dynamic deal stage based on status
        "address": street1,
        "city": city,
        "state": state,
        "postal_code": postalCode,
        "latitude": latitude,
        "longitude": longitude,
        "sales_rep_id": sales_rep_id,
        "sr_id": leadId  // Custom property for lead ID
      }
    };

    // Make the API call to HubSpot to create a new deal
    const response = await axios.post(HUBSPOT_API_URL, dealData, {
      headers: {
        'Authorization': `Bearer ${hubspotAccessToken}`,  // Use Bearer token from GitHub Secrets
        'Content-Type': 'application/json'
      }
    });

    // Log the response and send success
    console.log('Deal created successfully:', response.data);
    res.status(200).json({
      message: 'Deal created successfully',
      dealId: response.data.id  // Return the created deal ID in the response
    });

  } catch (error) {
    // Log the error and send an error response
    console.error('Error creating deal:', error.response ? error.response.data : error.message);
    res.status(500).json({
      message: 'Error creating deal',
      error: error.message  // Send the error message back to the client
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
