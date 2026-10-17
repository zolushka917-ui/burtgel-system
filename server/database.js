
const { Pool } = require('pg')
const bcrypt = require('bcrypt')

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL тохируулаагүй байна.')
}

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

async function initDb() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      "lastName" TEXT NOT NULL,
      "firstName" TEXT NOT NULL,
      phone TEXT NOT NULL,
      subject TEXT DEFAULT '',
      "invitedBy" TEXT DEFAULT '',
      teacher TEXT DEFAULT '',
      note TEXT DEFAULT '',
      "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Өмнө нь үүссэн хүснэгтэд шинэ багануудыг нэмнэ.
  // Хуучин бүртгэлүүд устахгүй.
  await db.query(`
    ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS "invitedBy" TEXT DEFAULT ''
  `)

  await db.query(`
    ALTER TABLE registrations
    ADD COLUMN IF NOT EXISTS teacher TEXT DEFAULT ''
  `)

  await db.query(`
    CREATE TABLE IF NOT EXISTS admins (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `)

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

  console.log('Өгөгдлийн сан бэлэн боллоо!')
}

module.exports = { db, initDb }
