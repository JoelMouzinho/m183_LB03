const jwt = require("jsonwebtoken");

const SECRET_KEY = "dein_secret_key"; // Geheimschlüssel zum Signieren der JWTs

// Middleware zum Überprüfen des JWTs
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Extrahiere das Token aus dem Authorization-Header

  if (!token) {
    return res.status(403).json({ message: "Token fehlt" });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Ungültiges Token" });
    }
    req.user = decoded; // Decodiertes Token mit Benutzerinformation
    next();
  });
};

module.exports = { verifyToken };