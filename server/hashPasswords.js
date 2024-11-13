const bcrypt = require('bcrypt');
const { queryDB, insertDB } = require("./database");

const hashExistingPasswords = async (db) => {
  // Hole alle Benutzer aus der Datenbank
  const users = await queryDB(db, "SELECT * FROM users");

  for (let user of users) {
    if (!user.password || user.password.length < 60) {  // Prüfe, ob das Passwort bereits gehasht wurde
      const hashedPassword = await bcrypt.hash(user.password, 10);  // Hash das Passwort mit bcrypt
      await db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, user.id]);  // Update das Passwort in der DB
      console.log(`Passwort für ${user.username} wurde gehasht und aktualisiert.`);
    }
  }
};

module.exports = { hashExistingPasswords };