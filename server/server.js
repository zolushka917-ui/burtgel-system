const express = require('express')
const cors = require('cors')
const bcrypt = require('bcrypt')
const db = require('./database')

const app = express()

const PORT = 5001

app.use(express.json())
app.use(cors())

// Нүүр хуудас
app.get('/', (req, res) => {
  res.send('Backend ажиллаж байна!')
})

// Бүх бүртгэл харах
app.get('/api/registrations', (req, res) => {
  const registrations = db
    .prepare('SELECT * FROM registrations ORDER BY id DESC')
    .all()

  res.json(registrations)
})

// Шинэ бүртгэл нэмэх
app.post('/api/registrations', (req, res) => {
  const {
    date,
    lastName,
    firstName,
    phone,
    subject,
    note
  } = req.body

  if (!date || !lastName || !firstName || !phone) {
    return res.status(400).json({
      message: 'Огноо, овог, нэр, утас заавал бөглөнө үү.'
    })
  }

  const result = db.prepare(`
    INSERT INTO registrations
    (date, lastName, firstName, phone, subject, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    date,
    lastName,
    firstName,
    phone,
    subject || '',
    note || ''
  )

  const newRegistration = db
    .prepare('SELECT * FROM registrations WHERE id = ?')
    .get(result.lastInsertRowid)

  res.status(201).json(newRegistration)
})

// Бүртгэл засах
app.put('/api/registrations/:id', (req, res) => {
  const id = Number(req.params.id)

  const {
    date,
    lastName,
    firstName,
    phone,
    subject,
    note
  } = req.body

  if (!date || !lastName || !firstName || !phone) {
    return res.status(400).json({
      message: 'Огноо, овог, нэр, утас заавал бөглөнө үү.'
    })
  }

  const result = db.prepare(`
    UPDATE registrations
    SET
      date = ?,
      lastName = ?,
      firstName = ?,
      phone = ?,
      subject = ?,
      note = ?
    WHERE id = ?
  `).run(
    date,
    lastName,
    firstName,
    phone,
    subject || '',
    note || '',
    id
  )

  if (result.changes === 0) {
    return res.status(404).json({
      message: 'Бүртгэл олдсонгүй.'
    })
  }

  const updatedRegistration = db
    .prepare('SELECT * FROM registrations WHERE id = ?')
    .get(id)

  res.json(updatedRegistration)
})

// Бүртгэл устгах
app.delete('/api/registrations/:id', (req, res) => {
  const id = Number(req.params.id)

  const result = db
    .prepare('DELETE FROM registrations WHERE id = ?')
    .run(id)

  if (result.changes === 0) {
    return res.status(404).json({
      message: 'Бүртгэл олдсонгүй.'
    })
  }

  res.json({
    message: 'Бүртгэл амжилттай устгагдлаа.'
  })
})

// Админ нэвтрэх
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body

  const admin = db
    .prepare(`
      SELECT * FROM admins
      WHERE username = ?
    `)
    .get(username)

  if (!admin) {
    return res.status(401).json({
      message: 'Нэвтрэх нэр эсвэл нууц үг буруу байна.'
    })
  }

  const passwordCorrect = await bcrypt.compare(
    password,
    admin.password
  )

  if (!passwordCorrect) {
    return res.status(401).json({
      message: 'Нэвтрэх нэр эсвэл нууц үг буруу байна.'
    })
  }

  res.json({
    message: 'Амжилттай нэвтэрлээ!',
    username: admin.username
  })
})
// Админы нууц үг солих
app.put('/api/change-password', async (req, res) => {
  const {
    currentPassword,
    newPassword
  } = req.body

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

  const admin = db
    .prepare(`
      SELECT * FROM admins
      WHERE username = ?
    `)
    .get('admin')

  if (!admin) {
    return res.status(404).json({
      message: 'Админ олдсонгүй.'
    })
  }

  const passwordCorrect = await bcrypt.compare(
    currentPassword,
    admin.password
  )

  if (!passwordCorrect) {
    return res.status(401).json({
      message: 'Одоогийн нууц үг буруу байна.'
    })
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    10
  )

  db.prepare(`
    UPDATE admins
    SET password = ?
    WHERE username = ?
  `).run(
    hashedPassword,
    'admin'
  )

  res.json({
    message: 'Нууц үг амжилттай солигдлоо.'
  })
})
app.listen(PORT, () => {
  console.log(
    `Backend ажиллаж байна: http://localhost:${PORT}`
  )
})