
const { Pool } = require('pg')
const bcrypt = require('bcrypt')

// Neon PostgreSQL холболт
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL тохируулаагүй байна.')
}

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
})

// Өгөгдлийн сангийн хүснэгтүүдийг үүсгэх
async function initDb() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "firstName" TEXT NOT NULL,
      phone TEXT NOT NULL,
      subject TEXT DEFAULT '',
      note TEXT DEFAULT '',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `)

  // Анхны админ байхгүй үед үүсгэнэ
  const result = await db.query(
    'SELECT * FROM admins WHERE username = $1',
    ['admin']
  )

  if (result.rows.length === 0) {
    const hashedPassword = await bcrypt.hash('1234', 10)

    await db.query(
      'INSERT INTO admins (username, password) VALUES ($1, $2)',
      ['admin', hashedPassword]
    )

    console.log('Анхны админ үүсгэгдлээ!')
  }

  console.log('Neon PostgreSQL бэлэн боллоо!')
}

module.exports = { db, initDb }

