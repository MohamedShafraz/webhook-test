const express    = require("express");
const bodyParser = require("body-parser");
const axios      = require("axios");
const serverless = require("serverless-http");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const token   = process.env.TOKEN;
const mytoken = process.env.MYTOKEN;

app.get("/webhook", (req, res) => {
  const { "hub.mode": mode, "hub.challenge": challenge, "hub.verify_token": tkn } = req.query;
  if (mode === "subscribe" && tkn === mytoken) return res.status(200).send(challenge);
  res.sendStatus(403);
});

app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object &&
      body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]
  ) {
    const meta   = body.entry[0].changes[0].value.metadata;
    const msg    = body.entry[0].changes[0].value.messages[0];
    try {
      await axios.post(
        `https://graph.facebook.com/v13.0/${meta.phone_number_id}/messages`,
        {
          messaging_product: "whatsapp",
          to:    msg.from,
          text:  { body: `Hi, you said: ${msg.text.body}` }
        },
        { params: { access_token: token } }
      );
      return res.sendStatus(200);
    } catch (err) {
      console.error(err);
      return res.sendStatus(500);
    }
  }
  res.sendStatus(404);
});

app.get("/", (req, res) => res.send("hello this is webhook setup"));

module.exports = serverless(app);
