
const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const { db, initDb } = require('./database')

const app = express()
const PORT = process.env.PORT || 5001

app.use(express.json())
app.use(cors({ maxAge: 86400 }))

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
app.post('/api/registrations', async (req, res) => {
  try {
    const { date, lastName, firstName, phone, subject, note } = req.body

    if (!date || !lastName || !firstName || !phone) {
      return res.status(400).json({
        message: 'Огноо, овог, нэр, утас заавал бөглөнө үү.'
      })
    }

    const result = await db.query(
      `INSERT INTO registrations
       (date, "lastName", "firstName", phone, subject, note)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [date, lastName, firstName, phone, subject || '', note || '']
    )

    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Бүртгэл нэмэх алдаа:', error)
    res.status(500).json({ message: 'Бүртгэл нэмэхэд алдаа гарлаа.' })
  }
})

// Бүртгэл засах
app.put('/api/registrations/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const { date, lastName, firstName, phone, subject, note } = req.body

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'Бүртгэлийн дугаар буруу байна.' })
    }

    if (!date || !lastName || !firstName || !phone) {
      return res.status(400).json({
        message: 'Огноо, овог, нэр, утас заавал бөглөнө үү.'
      })
    }

    const result = await db.query(
      `UPDATE registrations
       SET date = $1, "lastName" = $2, "firstName" = $3,
           phone = $4, subject = $5, note = $6
       WHERE id = $7
       RETURNING *`,
      [date, lastName, firstName, phone, subject || '', note || '', id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Бүртгэл олдсонгүй.' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Бүртгэл засах алдаа:', error)
    res.status(500).json({ message: 'Бүртгэл засахад алдаа гарлаа.' })
  }
})

// Бүртгэл устгах
app.delete('/api/registrations/:id', async (req, res) => {
  try {
    const id = Number(req.params.id)

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({ message: 'Бүртгэлийн дугаар буруу байна.' })
    }

    const result = await db.query(
      'DELETE FROM registrations WHERE id = $1 RETURNING id',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Бүртгэл олдсонгүй.' })
    }

    res.json({ message: 'Бүртгэл амжилттай устгагдлаа.' })
  } catch (error) {
    console.error('Бүртгэл устгах алдаа:', error)
    res.status(500).json({ message: 'Бүртгэл устгахад алдаа гарлаа.' })
  }
})

// Админ нэвтрэх
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        message: 'Нэвтрэх нэр болон нууц үгээ оруулна уу.'
      })
    }

    const result = await db.query(
      'SELECT * FROM admins WHERE username = $1',
      [username]
    )
    const admin = result.rows[0]

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({
        message: 'Нэвтрэх нэр эсвэл нууц үг буруу байна.'
      })
    }

    res.json({
      message: 'Амжилттай нэвтэрлээ!',
      username: admin.username
    })
  } catch (error) {
    console.error('Админ нэвтрэх алдаа:', error)
    res.status(500).json({ message: 'Нэвтрэх үед алдаа гарлаа.' })
  }
})

// Админы нууц үг солих
app.put('/api/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Одоогийн болон шинэ нууц үгээ оруулна уу.'
      })
    }

    if (newPassword.length < 4) {
      return res.status(400).json({
        message: 'Шинэ нууц үг хамгийн багадаа 4 тэмдэгт байна.'
      })
    }

    const result = await db.query(
      'SELECT * FROM admins WHERE username = $1',
      ['admin']
    )
    const admin = result.rows[0]

    if (!admin) {
      return res.status(404).json({ message: 'Админ олдсонгүй.' })
    }

    if (!(await bcrypt.compare(currentPassword, admin.password))) {
      return res.status(401).json({
        message: 'Одоогийн нууц үг буруу байна.'
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await db.query(
      'UPDATE admins SET password = $1 WHERE username = $2',
      [hashedPassword, 'admin']
    )

    res.json({ message: 'Нууц үг амжилттай солигдлоо.' })
  } catch (error) {
    console.error('Нууц үг солих алдаа:', error)
    res.status(500).json({ message: 'Нууц үг солиход алдаа гарлаа.' })
  }
})

// Өгөгдлийн сан бэлэн болсны дараа серверийг асаана
async function startServer() {
  try {
    await initDb()

    app.listen(PORT, () => {
      console.log(`Backend ажиллаж байна: порт ${PORT}`)
    })
  } catch (error) {
    console.error('Сервер эхлүүлэх алдаа:', error)
    process.exit(1)
  }
}

startServer()