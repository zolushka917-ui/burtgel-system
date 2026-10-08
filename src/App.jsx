import { useEffect, useState } from 'react'

function App() {
  const [showForm, setShowForm] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [password, setPassword] = useState('')

  const [formData, setFormData] = useState({
    date: '',
    lastName: '',
    firstName: '',
    phone: '',
    subject: '',
    note: '',
  })

  const [registrations, setRegistrations] = useState([])

  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)

  // Бүртгэлүүдийг database-ээс авах
  const loadRegistrations = async () => {
    try {
      const response = await fetch(
        'https://burtgel-backend-l2lv.onrender.com/api/registrations'
      )
      const data = await response.json()

      if (!response.ok) {
        alert(data.message || 'Бүртгэл авахад алдаа гарлаа.')
        return
      }

      setRegistrations(data)
    } catch (error) {
      console.error(error)
      alert('Backend-тэй холбогдож чадсангүй.')
    }
  }

  // Админ орсон үед database-ээс мэдээлэл авна
  useEffect(() => {
    if (isAdmin) {
      loadRegistrations()
    }
  }, [isAdmin])

  const handleChange = (e) => {
    const { name, value } = e.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const resetForm = () => {
    setFormData({
      date: '',
      lastName: '',
      firstName: '',
      phone: '',
      subject: '',
      note: '',
    })
  }

  // Шинэ бүртгэл үүсгэх
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(
        'https://burtgel-backend-l2lv.onrender.com/api/registrations',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || 'Бүртгэл хадгалахад алдаа гарлаа.')
        return
      }

      alert('Бүртгэл амжилттай хадгалагдлаа!')

      resetForm()
      setShowForm(false)
    } catch (error) {
      console.error(error)
      alert('Backend-тэй холбогдож чадсангүй.')
    }
  }

  // Админ нэвтрэх
  const handleAdminLogin = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(
       'https://burtgel-backend-l2lv.onrender.com/api/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username: 'admin',
            password: password,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(
          data.message ||
          'Нэвтрэх нэр эсвэл нууц үг буруу байна.'
        )
        return
      }

      setIsAdmin(true)
      setShowAdmin(true)
      setPassword('')
    } catch (error) {
      console.error(error)
      alert('Backend-тэй холбогдож чадсангүй.')
    }
  }

  // Бүртгэл устгах
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Энэ бүртгэлийг устгах уу?'
    )

    if (!confirmDelete) {
      return
    }

    try {
  const response = await fetch(
    `https://burtgel-backend-l2lv.onrender.com/api/registrations/${id}`,
    {
      method: 'DELETE',
    }
  )

  const data = await response.json()

      if (!response.ok) {
        alert(data.message || 'Устгахад алдаа гарлаа.')
        return
      }

      alert('Бүртгэл устгагдлаа!')

      loadRegistrations()
    } catch (error) {
      console.error(error)
      alert('Backend-тэй холбогдож чадсангүй.')
    }
  }

  // Бүртгэл засах
  const handleEdit = (registration) => {
    setFormData({
      date: registration.date,
      lastName: registration.lastName,
      firstName: registration.firstName,
      phone: registration.phone,
      subject: registration.subject || '',
      note: registration.note || '',
    })

    setEditingId(registration.id)
  }

  // Зассан мэдээллийг database-д хадгалах
  const handleUpdate = async (e) => {
    e.preventDefault()

   try {
  const response = await fetch(
    `https://burtgel-backend-l2lv.onrender.com/api/registrations/${editingId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    }
  )

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || 'Засахад алдаа гарлаа.')
        return
      }

      alert('Бүртгэл амжилттай засагдлаа!')

      resetForm()
      setEditingId(null)

      loadRegistrations()
    } catch (error) {
      console.error(error)
      alert('Backend-тэй холбогдож чадсангүй.')
    }
  }

  const filteredRegistrations = registrations.filter(
    (registration) => {
      const text = [
        registration.date,
        registration.lastName,
        registration.firstName,
        registration.phone,
        registration.subject,
        registration.note,
      ]
        .join(' ')
        .toLowerCase()

      return text.includes(
        search.trim().toLowerCase()
      )
    }
  )

  return (
    <div className="app">

      {/* Header */}
      <header className="header">
        <div>
          <h1>Бүртгэлийн систем</h1>
          <p>Мэдээлэл бүртгэл ба удирдлагын систем</p>
        </div>

        {isAdmin && (
          <div className="admin-badge">
            🔐 Админ
          </div>
        )}
      </header>

      {/* Нүүр */}
      {!showForm && !showAdmin && (
        <main className="home">

          <div className="welcome">
            <h2>Тавтай морилно уу 👋</h2>
            <p>
              Бүртгэл үүсгэх эсвэл админ хэсэгт
              нэвтэрнэ үү.
            </p>
          </div>

          <div className="home-buttons">

            <button
              className="main-button"
              onClick={() => setShowForm(true)}
            >
              📝 Бүртгэл үүсгэх
            </button>

            <button
              className="secondary-button"
              onClick={() => setShowAdmin(true)}
            >
              🔐 Админ хэсэг
            </button>

          </div>

        </main>
      )}

      {/* Бүртгэл үүсгэх */}
      {showForm && (
        <main className="card">

          <div className="card-title">
            <h2>📝 Шинэ бүртгэл</h2>
            <p>Мэдээллээ үнэн зөв бөглөнө үү.</p>
          </div>

          <form onSubmit={handleSubmit}>

            <div className="form-grid">

              <div className="form-group">
                <label>Огноо</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Овог</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Овог"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Нэр</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Нэр"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Утасны дугаар</label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="99112233"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full">
                <label>Хичээл</label>
                <input
                  type="text"
                  name="subject"
                  placeholder="Хичээлийн нэр"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full">
                <label>Тайлбар</label>
                <textarea
                  name="note"
                  placeholder="Нэмэлт тайлбар..."
                  value={formData.note}
                  onChange={handleChange}
                />
              </div>

            </div>

            <div className="form-buttons">

              <button
                type="submit"
                className="main-button"
              >
                💾 Хадгалах
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  resetForm()
                  setShowForm(false)
                }}
              >
                ← Буцах
              </button>

            </div>

          </form>

        </main>
      )}

      {/* Админ нэвтрэх */}
      {showAdmin && !isAdmin && (
        <main className="login-card">

          <div className="login-icon">
            🔐
          </div>

          <h2>Админ нэвтрэх</h2>

          <p>
            Админ хэсэгт нэвтрэхийн тулд
            нууц үгээ оруулна уу.
          </p>

          <form onSubmit={handleAdminLogin}>

            <input
              type="password"
              placeholder="Нууц үг"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
            />

            <button
              type="submit"
              className="main-button"
            >
              Нэвтрэх
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowAdmin(false)
                setPassword('')
              }}
            >
              ← Буцах
            </button>

          </form>

        </main>
      )}

      {/* Админ хэсэг */}
      {showAdmin && isAdmin && (
        <main className="admin">

          {/* Admin top */}
          <div className="admin-top">

            <div>
              <h2>Админ хэсэг</h2>
              <p>
                Бүртгэлүүдийг эндээс удирдана.
              </p>
            </div>

            <button
              className="logout-button"
              onClick={() => {
                setIsAdmin(false)
                setShowAdmin(false)
                setSearch('')
                setEditingId(null)
                resetForm()
              }}
            >
              Гарах
            </button>

          </div>

          {/* Засах хэсэг */}
          {editingId !== null && (
            <div className="edit-card">

              <h3>✏️ Бүртгэл засах</h3>

              <form onSubmit={handleUpdate}>

                <div className="form-grid">

                  <div className="form-group">
                    <label>Огноо</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Овог</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Нэр</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Утас</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group full">
                    <label>Хичээл</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group full">
                    <label>Тайлбар</label>
                    <textarea
                      name="note"
                      value={formData.note}
                      onChange={handleChange}
                    />
                  </div>

                </div>

                <div className="form-buttons">

                  <button
                    type="submit"
                    className="main-button"
                  >
                    💾 Өөрчлөлтийг хадгалах
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingId(null)
                      resetForm()
                    }}
                  >
                    Болих
                  </button>

                </div>

              </form>

            </div>
          )}

          {/* Search */}
          {editingId === null && (
            <div className="search-box">

              <input
                type="text"
                placeholder="🔎 Нэр, овог, утас, хичээлээр хайх..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>
          )}

          {/* Statistics */}
          <div className="statistics">

            <div className="stat-card">
              <span>Нийт бүртгэл</span>
              <strong>
                {registrations.length}
              </strong>
            </div>

            <div className="stat-card">
              <span>Хайлтын үр дүн</span>
              <strong>
                {filteredRegistrations.length}
              </strong>
            </div>

          </div>

          {/* Table */}
          <div className="table-container">

            {filteredRegistrations.length === 0 ? (
              <div className="empty">
                <div>📭</div>
                <h3>Бүртгэл олдсонгүй</h3>
                <p>
                  Хайлтад тохирох мэдээлэл байхгүй байна.
                </p>
              </div>
            ) : (
              <table>

                <thead>
                  <tr>
                    <th>№</th>
                    <th>Огноо</th>
                    <th>Овог</th>
                    <th>Нэр</th>
                    <th>Утас</th>
                    <th>Хичээл</th>
                    <th>Тайлбар</th>
                    <th>Үйлдэл</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRegistrations.map(
                    (registration, index) => (
                      <tr key={registration.id}>

                        <td>
                          {index + 1}
                        </td>

                        <td>
                          {registration.date}
                        </td>

                        <td>
                          {registration.lastName}
                        </td>

                        <td>
                          <strong>
                            {registration.firstName}
                          </strong>
                        </td>

                        <td>
                          {registration.phone}
                        </td>

                        <td>
                          <span className="subject">
                            {registration.subject}
                          </span>
                        </td>

                        <td>
                          {registration.note || '-'}
                        </td>

                        <td>
                          <div className="action-buttons">

                            <button
                              className="edit-button"
                              onClick={() =>
                                handleEdit(registration)
                              }
                            >
                              ✏️
                            </button>

                            <button
                              className="delete-button"
                              onClick={() =>
                                handleDelete(
                                  registration.id
                                )
                              }
                            >
                              🗑️
                            </button>

                          </div>
                        </td>

                      </tr>
                    )
                  )}
                </tbody>

              </table>
            )}

          </div>

        </main>
      )}

    </div>
  )
}

export default App