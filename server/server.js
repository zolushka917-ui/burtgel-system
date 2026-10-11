
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const { db, initDb } = require('./database')

const app = express()
const PORT = process.env.PORT || 5001

app.use(express.json())
app.use(cors())

// Нүүр хуудас
app.get('/', (req, res) => {
  res.send('Backend ажиллаж байна!')
})

// Бүх бүртгэл харах
app.get('/api/registrations', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM registrations ORDER BY id DESC'
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Бүртгэл унших алдаа:', error)
    res.status(500).json({ message: 'Бүртгэл уншихад алдаа гарлаа.' })
  }
})

// Шинэ бүртгэл нэмэх
app.post('/api/registrations', async (req,

