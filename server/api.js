const { initializeDatabase, queryDB, insertDB } = require("./database");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("./auth");
const bcrypt = require("bcrypt");
const CryptoJS = require("crypto-js");
require('dotenv').config();

const encryptionKey = process.env.ENCRYPTION_KEY
const SECRET_KEY = "dein_secret_key";

let db;

const escapeString = (str) => {
  if (!str) return "";
  return str.replace(/['"]/g, "\\$&"); // Escaped einfache und doppelte Anführungszeichen
};

// Hilfsfunktion zum Escape von HTML-Inhalten
const escapeHTML = (str) => {
  return str.replace(/[&<>"']/g, (match) => {
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return escapeMap[match];
  });
};

const encrypt = (text) => {
  const ciphertext = CryptoJS.AES.encrypt(text, encryptionKey).toString();
  return ciphertext;
};

const decrypt = (ciphertext) => {
  const bytes = CryptoJS.AES.decrypt(ciphertext, encryptionKey);
  const originalText = bytes.toString(CryptoJS.enc.Utf8);
  return originalText;
};

// Rate limiter for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minuten Zeitfenster
  max: 5, // Maximale Versuche pro IP
  handler: (req, res) => {
    res.status(429).json({ error: "Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut." });
  },
});

const initializeAPI = async (app) => {
  db = await initializeDatabase();
  app.get("/api/feed", verifyToken, getFeed);
  app.post("/api/feed", verifyToken, postTweet);
  app.post("/api/login", loginLimiter, login);
};

const getFeed = async (req, res) => {
  const query = "SELECT * FROM tweets ORDER BY id DESC";
  const tweets = await queryDB(db, query);

  const descryptedTweets = tweets.map(tweet => ({
    ...tweet,
    text: decrypt(tweet.text),
  }));

  res.json(descryptedTweets);
};

const postTweet = async (req, res) => {
  const { text } = req.body;
  const username = req.user.username; // Benutzername aus dem Token
  const timestamp = new Date().toISOString();

  const escapedText = escapeHTML(text);
  console.log(escapedText);
  const encryptedText = encrypt(escapedText);

  const query = `INSERT INTO tweets (username, timestamp, text) VALUES ('${escapeString(username)}', '${escapeString(timestamp)}', '${escapeString(encryptedText)}')`;
  await insertDB(db, query);

  res.json({ status: "Tweet erfolgreich gepostet" });
};

const login = async (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = ?`;
  const user = await queryDB(db, query, [username]);

  if (user.length === 1) {
    const userData = user[0];
      // Erstelle ein JWT
      const match = await bcrypt.compare(password, userData.password);
      if(match) {
        const token = jwt.sign({ username: userData.username}, SECRET_KEY, {
          expiresIn: "1h", // Gültigkeit des Tokens für 1 Stunde
        });
        return res.json({ token });
    } else {
      return res.status(401).json({ message: "Benutzer nicht gefunden" });
    }
      }
};

module.exports = { initializeAPI };
