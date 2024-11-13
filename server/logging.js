const winston = require("winston");

// Logging-Setup
const logTransport = new winston.transports.File({ filename: "server.log" });

const logger = winston.createLogger({
  level: "info",
  transports: [
    logTransport,
    new winston.transports.Console({ format: winston.format.simple() }) // Für die Konsole
  ],
});

const logRequest = (req, res, next) => {
  const { method, url, ip } = req;
  const timestamp = new Date().toISOString();
  
  logger.info(`[${timestamp}] ${method} ${url} from ${ip}`);
  
  next();
};

module.exports = logRequest;