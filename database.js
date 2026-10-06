const Database = require('better-sqlite3')
const bcrypt = require('bcrypt')

const db = new Database('burtgel.db')

// Бүртгэлийн хүснэгт
db.prepare(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    lastName TEXT NOT NULL,
    firstName TEXT NOT NULL,
    phone TEXT NOT NULL,
    subject TEXT,
    note TEXT,
    createdAt TEXT DEFAULT CURRENT_TIMESTAMP
  )
`).run()

// Админы хүснэгт
db.prepare(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`).run()

// Анхны админ үүсгэх
const adminExists = db
  .prepare('SELECT * FROM admins WHERE username = ?')
  .get('admin')

if (!adminExists) {
  const hashedPassword = bcrypt.hashSync('1234', 10)

  db.prepare(`
    INSERT INTO admins (username, password)
    VALUES (?, ?)
  `).run('admin', hashedPassword)

  console.log('Анхны админ үүсгэгдлээ!')
}

console.log('Database бэлэн боллоо!')

module.exports = db