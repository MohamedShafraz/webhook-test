// api/webhook.js
const express      = require("express");
const bodyParser   = require("body-parser");
const axios        = require("axios");
const serverless   = require("serverless-http");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const token   = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;

// Verify callback URL
app.get("/webhook", (req, res) => {
  const { "hub.mode": mode, "hub.challenge": challenge, "hub.verify_token": tokenReceived } = req.query;
  if (mode === "subscribe" && tokenReceived === mytoken) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Handle incoming WhatsApp messages
app.post("/webhook", async (req, res) => {
  const body = req.body;
  console.log(JSON.stringify(body, null, 2));
  if (body.object &&
      body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  ) {
    const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
    const from          = body.entry[0].changes[0].value.messages[0].from;
    const msgBody       = body.entry[0].changes[0].value.messages[0].text.body;

    try {
      await axios.post(
        `https://graph.facebook.com/v13.0/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to:     from,
          text:   { body: `Hi.. I'm Prasath, your message is ${msgBody}` }
        },
        { headers: { "Content-Type": "application/json" },
          params: { access_token: token } }
      );
      return res.sendStatus(200);
    } catch (err) {
      console.error("Error sending message:", err.response?.data || err.message);
      return res.sendStatus(500);
    }
  }
  res.sendStatus(404);
});

// A simple root endpoint
app.get("/", (req, res) => {
  res.status(200).send("hello this is webhook setup");
});

// Export as serverless handler
module.exports = serverless(app);
