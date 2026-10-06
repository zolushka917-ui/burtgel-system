import { useEffect, useState } from 'react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function App() {
  const [showForm, setShowForm] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  const [password, setPassword] = useState('')

  const [showChangePassword, setShowChangePassword] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

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

  const loadRegistrations = async () => {
    try {
      const response = await fetch(
        'http://localhost:5001/api/registrations'
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

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(
        'http://localhost:5001/api/registrations',
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

  const handleAdminLogin = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(
        'http://localhost:5001/api/login',
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

  const handleChangePassword = async (e) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      alert('Шинэ нууц үг хоорондоо таарахгүй байна.')
      return
    }

    if (newPassword.length < 4) {
      alert('Шинэ нууц үг хамгийн багадаа 4 тэмдэгт байна.')
      return
    }

    try {
      const response = await fetch(
        'http://localhost:5001/api/change-password',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        alert(
          data.message ||
          'Нууц үг солиход алдаа гарлаа.'
        )
        return
      }

      alert('Нууц үг амжилттай солигдлоо! 🔐')

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowChangePassword(false)
    } catch (error) {
      console.error(error)
      alert('Backend-тэй холбогдож чадсангүй.')
    }
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Энэ бүртгэлийг устгах уу?'
    )

    if (!confirmDelete) {
      return
    }

    try {
      const response = await fetch(
        `http://localhost:5001/api/registrations/${id}`,
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

  const handleUpdate = async (e) => {
    e.preventDefault()

    try {
      const response = await fetch(
        `http://localhost:5001/api/registrations/${editingId}`,
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

  // Excel татах
  const exportToExcel = () => {
    if (filteredRegistrations.length === 0) {
      alert('Татах бүртгэл алга байна.')
      return
    }

    const excelData = filteredRegistrations.map(
      (registration, index) => ({
        '№': index + 1,
        'Огноо': registration.date,
        'Овог': registration.lastName,
        'Нэр': registration.firstName,
        'Утас': registration.phone,
        'Хичээл': registration.subject,
        'Тайлбар': registration.note || '',
      })
    )

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Бүртгэлүүд'
    )

    XLSX.writeFile(
      workbook,
      'burtgeliin-medeelel.xlsx'
    )
  }

  // PDF татах
  const exportToPDF = async () => {
    if (filteredRegistrations.length === 0) {
      alert('Татах бүртгэл алга байна.')
      return
    }

    try {
      const fontResponse = await fetch(
        '/fonts/NotoSans-Regular.ttf'
      )

      if (!fontResponse.ok) {
        throw new Error('Font файл олдсонгүй.')
      }

      const fontBuffer = await fontResponse.arrayBuffer()

      let binary = ''
      const bytes = new Uint8Array(fontBuffer)
      const chunkSize = 8192

      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(
          ...bytes.subarray(
            i,
            Math.min(i + chunkSize, bytes.length)
          )
        )
      }

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      })

      doc.addFileToVFS(
        'NotoSans-Regular.ttf',
        binary
      )

      doc.addFont(
        'NotoSans-Regular.ttf',
        'NotoSans',
        'normal'
      )

      doc.setFont('NotoSans', 'normal')

      doc.setFontSize(18)
      doc.text(
        'Бүртгэлийн мэдээлэл',
        14,
        15
      )

      doc.setFontSize(10)
      doc.text(
        `Нийт: ${filteredRegistrations.length} бүртгэл`,
        14,
        22
      )

      const tableData = filteredRegistrations.map(
        (registration, index) => [
          String(index + 1),
          registration.date || '',
          registration.lastName || '',
          registration.firstName || '',
          registration.phone || '',
          registration.subject || '',
          registration.note || '-',
        ]
      )

      autoTable(doc, {
        startY: 28,
        head: [
          [
            '№',
            'Огноо',
            'Овог',
            'Нэр',
            'Утас',
            'Хичээл',
            'Тайлбар',
          ],
        ],
        body: tableData,
        styles: {
          font: 'NotoSans',
          fontStyle: 'normal',
          fontSize: 8,
        },
        headStyles: {
          font: 'NotoSans',
          fontStyle: 'normal',
          fontSize: 8,
        },
      })

      doc.save(
        'burtgeliin-medeelel.pdf'
      )
    } catch (error) {
      console.error(error)
      alert(
        'PDF үүсгэхэд алдаа гарлаа. Font файлыг шалгана уу.'
      )
    }
  }

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
          <div className="admin-top">
            <div>
              <h2>Админ хэсэг</h2>
              <p>
                Бүртгэлүүдийг эндээс удирдана.
              </p>
            </div>

            <div className="form-buttons">
              <button
                className="secondary-button"
                onClick={() => {
                  setShowChangePassword(
                    !showChangePassword
                  )
                  setEditingId(null)
                }}
              >
                🔐 Нууц үг солих
              </button>

              <button
                className="logout-button"
                onClick={() => {
                  setIsAdmin(false)
                  setShowAdmin(false)
                  setSearch('')
                  setEditingId(null)
                  setShowChangePassword(false)
                  setCurrentPassword('')
                  setNewPassword('')
                  setConfirmPassword('')
                  resetForm()
                }}
              >
                Гарах
              </button>
            </div>
          </div>

          {showChangePassword && (
            <div className="edit-card">
              <h3>🔐 Нууц үг солих</h3>

              <form onSubmit={handleChangePassword}>
                <div className="form-grid">
                  <div className="form-group full">
                    <label>Одоогийн нууц үг</label>

                    <input
                      type="password"
                      placeholder="Одоогийн нууц үг"
                      value={currentPassword}
                      onChange={(e) =>
                        setCurrentPassword(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Шинэ нууц үг</label>

                    <input
                      type="password"
                      placeholder="Шинэ нууц үг"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Шинэ нууц үг давтах</label>

                    <input
                      type="password"
                      placeholder="Шинэ нууц үгээ давтана уу"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-buttons">
                  <button
                    type="submit"
                    className="main-button"
                  >
                    💾 Нууц үг солих
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setShowChangePassword(false)
                      setCurrentPassword('')
                      setNewPassword('')
                      setConfirmPassword('')
                    }}
                  >
                    Болих
                  </button>
                </div>
              </form>
            </div>
          )}

          {!showChangePassword &&
            editingId !== null && (
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

          {!showChangePassword &&
            editingId === null && (
              <>
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

                <div className="form-buttons">
                  <button
                    type="button"
                    className="main-button"
                    onClick={exportToExcel}
                  >
                    📊 Excel татах
                  </button>

                  <button
                    type="button"
                    className="secondary-button"
                    onClick={exportToPDF}
                  >
                    📄 PDF татах
                  </button>
                </div>
              </>
            )}

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
                        <td>{index + 1}</td>

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
                                handleEdit(
                                  registration
                                )
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