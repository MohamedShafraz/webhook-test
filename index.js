// api/webhook.js
const express    = require("express");
const bodyParser = require("body-parser");
const axios      = require("axios");
const serverless = require("serverless-http");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const token   = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;

// Verification endpoint
app.get("/webhook", (req, res) => {
  const { "hub.mode": mode, "hub.challenge": challenge, "hub.verify_token": verifyToken } = req.query;
  if (mode === "subscribe" && verifyToken === mytoken) {
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// Incoming messages
app.post("/webhook", async (req, res) => {
  const body = req.body;
  console.log(JSON.stringify(body, null, 2));

  const msg = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
  if (body.object && msg) {
    const phoneNumberId = body.entry[0].changes[0].value.metadata.phone_number_id;
    const from          = msg.from;
    const text          = msg.text.body;

    try {
      await axios.post(
        `https://graph.facebook.com/v13.0/${phoneNumberId}/messages`,
        {
          messaging_product: "whatsapp",
          to: from,
          text: { body: `Hi.. I'm SHaf, your message is ${text}` }
        },
        {
          headers: { "Content-Type": "application/json" },
          params:  { access_token: token }
        }
      );
      return res.sendStatus(200);
    } catch (err) {
      console.error("Send error:", err.response?.data || err.message);
      return res.sendStatus(500);
    }
  }

  res.sendStatus(404);
});

// Optional root endpoint
app.get("/", (req, res) => {
  res.status(200).send("hello this is webhook setup");
});

// Export the serverless handler
module.exports = serverless(app);
