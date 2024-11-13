const { initializeDatabase, queryDB, insertDB } = require("./database");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");
const { verifyToken } = require("./auth");

let db;

const SECRET_KEY = "dein_secret_key";

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
  res.json(tweets);
};

const postTweet = async (req, res) => {
  const { text } = req.body;
  const username = req.user.username; // Benutzername aus dem Token
  const timestamp = new Date().toISOString();

  const query = `INSERT INTO tweets (username, timestamp, text) VALUES ('${username}', '${timestamp}', '${text}')`;
  await insertDB(db, query);

  res.json({ status: "Tweet erfolgreich gepostet" });
};

const login = async (req, res) => {
  const { username, password } = req.body;
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;
  const user = await queryDB(db, query);

  if (user.length === 1) {
    const userData = user[0];
      // Erstelle ein JWT
      const token = jwt.sign({ username: userData.username}, SECRET_KEY, {
        expiresIn: "1h", // Gültigkeit des Tokens für 1 Stunde
      });

      return res.json({ token });
    
  } else {
    return res.status(401).json({ message: "Benutzer nicht gefunden" });
  }
};

module.exports = { initializeAPI };
