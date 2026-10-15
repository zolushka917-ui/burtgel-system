import React, { useState, useEffect } from "react";
import "./App.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL =
  "https://burtgel-backend-l2lv.onrender.com/api/registrations";

function getCurrentDateTime() {
  const now = new Date();
  const localTime = new Date(
    now.getTime() - now.getTimezoneOffset() * 60000
  );
  return localTime.toISOString().slice(0, 16);
}

function formatDateTime(value) {
  if (!value) return "";
  const [datePart, timePart = ""] = String(value).split("T");
  const [year, month, day] = datePart.split("-");
  return `${day}.${month}.${year} ${timePart.slice(0, 5)}`;
}


function App() {

  const [showForm, setShowForm] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [modal, setModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [password, setPassword] = useState("");

  const [formData, setFormData] = useState({
    date: getCurrentDateTime(),
    lastName: "",
    firstName: "",
    phone: "",
    subject: "",
    note: "",
  });

  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Шинэ: өдөр сонгох болон хуудаслалт
  const [selectedDate, setSelectedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const showNotice = (message, type = "info") => {
    setModal({ message, type });
  };

  // Бүртгэлүүдийг database-ээс авах
  const loadRegistrations = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();

      if (!response.ok) {
        showNotice(
          "Бүртгэлийн мэдээлэл авахад алдаа гарлаа.",
          "error"
        );
        return;
      }

      setRegistrations(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Бүртгэл ачаалахад алдаа:", error);
      showNotice(
        "Сервертэй холбогдож чадсангүй. Интернэтээ шалгана уу.",
        "error"
      );
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadRegistrations();
    }
  }, [isAdmin]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      date: getCurrentDateTime(),
      lastName: "",
      firstName: "",
      phone: "",
      subject: "",
      note: "",
    });
  };

  // Шинэ бүртгэл үүсгэх
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSaving) return;

    if (!formData.date) {
      showNotice("Огноо, цагийг оруулна уу.", "error");
      return;
    }

    if (!formData.lastName.trim()) {
      showNotice("Овог оруулна уу.", "error");
      return;
    }

    if (!formData.firstName.trim()) {
      showNotice("Нэр оруулна уу.", "error");
      return;
    }

    if (!/^[0-9]{8}$/.test(formData.phone)) {
      showNotice("Утасны дугаар яг 8 оронтой байх ёстой.", "error");
      return;
    }

    if (!formData.subject.trim()) {
      showNotice("Хичээлийн нэрийг сонгоно уу.", "error");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        showNotice("Бүртгэл хадгалахад алдаа гарлаа.", "error");
        return;
      }

      showNotice("Бүртгэл амжилттай хадгалагдлаа!", "success");
      resetForm();
      setShowForm(false);

      if (isAdmin) {
        await loadRegistrations();
      }
    } catch (error) {
      console.error("Бүртгэл хадгалах алдаа:", error);
      showNotice(
        "Сервертэй холбогдож чадсангүй. Дахин оролдоно уу.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  
  // Админ нэвтрэх
  const handleAdminLogin = async (e) => {
    e.preventDefault();

    if (isLoggingIn) return;

    setIsLoggingIn(true);

    try {
      const response = await fetch(
        "https://burtgel-backend-l2lv.onrender.com/api/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "admin",
            password,
          }),
        }
      );

      if (!response.ok) {
        showNotice(
          "Нэвтрэх нэр эсвэл нууц үг буруу байна.",
          "error"
        );
        return;
      }

      setIsAdmin(true);
      setShowAdmin(true);
      setPassword("");
    } catch (error) {
      console.error("Админ нэвтрэхэд алдаа:", error);
      showNotice("Сервертэй холбогдож чадсангүй.", "error");
    } finally {
      setIsLoggingIn(false);
    }
  };
  // Excel татах — бүх бүртгэл
  const exportToExcel = () => {
    if (registrations.length === 0) {
      showNotice("Татаж авах бүртгэл алга байна.", "error");
      return;
    }

    const data = registrations.map((registration, index) => ({
      "№": index + 1,
      Огноо: formatDateTime(registration.date),
      Овог: registration.lastName,
      Нэр: registration.firstName,
      Утас: registration.phone,
      Хичээл: registration.subject,
      Тайлбар: registration.note || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Бүртгэл");
    XLSX.writeFile(workbook, "burtgeliin-medeelel.xlsx");
  };

  // PDF татах — бүх бүртгэл
  const exportToPDF = async () => {
    if (registrations.length === 0) {
      showNotice("Татаж авах бүртгэл алга байна.", "error");
      return;
    }

    try {
      const response = await fetch("/fonts/NotoSans-Regular.ttf");

      if (!response.ok) {
        throw new Error("Фонтын файл олдсонгүй.");
      }

      const fontBuffer = await response.arrayBuffer();
      const fontBytes = new Uint8Array(fontBuffer);
      let binary = "";
      const chunkSize = 0x8000;

      for (let i = 0; i < fontBytes.length; i += chunkSize) {
        binary += String.fromCharCode(
          ...fontBytes.subarray(i, i + chunkSize)
        );
      }

      const fontBase64 = window.btoa(binary);
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      doc.addFileToVFS("NotoSans-Regular.ttf", fontBase64);
      doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
      doc.setFont("NotoSans");
      doc.setFontSize(16);
      doc.text("Бүртгэлийн мэдээлэл", 14, 15);

      const rows = registrations.map((registration, index) => [
        String(index + 1),
        formatDateTime(registration.date),
        registration.lastName || "",
        registration.firstName || "",
        registration.phone || "",
        registration.subject || "",
        registration.note || "-",
      ]);

      autoTable(doc, {
        head: [["№", "Огноо", "Овог", "Нэр", "Утас", "Хичээл", "Тайлбар"]],
        body: rows,
        startY: 23,
        styles: {
          font: "NotoSans",
          fontSize: 8,
          cellPadding: 3,
          overflow: "linebreak",
        },
        headStyles: {
          font: "NotoSans",
          fontStyle: "normal",
        },
        margin: { left: 10, right: 10 },
      });

      doc.save("burtgeliin-medeelel.pdf");
    } catch (error) {
      console.error("PDF үүсгэхэд гарсан алдаа:", error);
      showNotice(
        "PDF үүсгэж чадсангүй. Фонтын файл байгаа эсэхийг шалгана уу.",
        "error"
      );
    }
  };

  // Устгах баталгаажуулалт
  const handleDelete = (id) => {
    setModal({
      message: "Энэ бүртгэлийг устгахдаа итгэлтэй байна уу?",
      type: "confirm",
      onConfirm: () => deleteRegistration(id),
    });
  };

  const deleteRegistration = async (id) => {
    setModal(null);

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        showNotice("Бүртгэл устгахад алдаа гарлаа.", "error");
        return;
      }

      showNotice("Бүртгэл амжилттай устгагдлаа!", "success");
      await loadRegistrations();
    } catch (error) {
      console.error("Бүртгэл устгах алдаа:", error);
      showNotice("Сервертэй холбогдож чадсангүй.", "error");
    }
  };

  // Бүртгэл засах
  const handleEdit = (registration) => {
    setFormData({
      date: registration.date
        ? String(registration.date).slice(0, 16)
        : "",
      lastName: registration.lastName || "",
      firstName: registration.firstName || "",
      phone: registration.phone || "",
      subject: registration.subject || "",
      note: registration.note || "",
    });

    setEditingId(registration.id);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (!formData.date) {
      showNotice("Огноо, цагийг оруулна уу.", "error");
      return;
    }

    if (!formData.lastName.trim()) {
      showNotice("Овог оруулна уу.", "error");
      return;
    }

    if (!formData.firstName.trim()) {
      showNotice("Нэр оруулна уу.", "error");
      return;
    }

    if (!/^[0-9]{8}$/.test(formData.phone)) {
      showNotice("Утасны дугаар яг 8 оронтой байх ёстой.", "error");
      return;
    }

    if (!formData.subject.trim()) {
      showNotice("Хичээлийн нэрийг сонгоно уу.", "error");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        showNotice("Бүртгэл засахад алдаа гарлаа.", "error");
        return;
      }

      showNotice("Бүртгэл амжилттай засагдлаа!", "success");
      resetForm();
      setEditingId(null);
      await loadRegistrations();
    } catch (error) {
      console.error("Бүртгэл засах алдаа:", error);
      showNotice("Сервертэй холбогдож чадсангүй.", "error");
    }
  };

  // Огноо болон хайлтын шүүлтүүр
  // Хуудаслалтаас өмнө шүүнэ. Иймээс хайлт бүх тохирох бүртгэлээс ажиллана.
  const filteredRegistrations = registrations.filter((registration) => {
    const registrationDate = String(registration.date || "").slice(0, 10);

    const matchesDate =
      selectedDate === "" || registrationDate === selectedDate;

    const text = [
      registration.date,
      registration.lastName,
      registration.firstName,
      registration.phone,
      registration.subject,
      registration.note,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = text.includes(search.trim().toLowerCase());

    return matchesDate && matchesSearch;
  });

  // Өгөгдөлд байгаа өдрүүдийг давхардуулахгүй гаргах
  const availableDates = [
    ...new Set(
      registrations
        .map((registration) =>
          String(registration.date || "").slice(0, 10)
        )
        .filter(Boolean)
    ),
  ].sort((a, b) => b.localeCompare(a));

  // Хуудаслалт
  const totalPages = Math.ceil(
    filteredRegistrations.length / itemsPerPage
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const paginatedRegistrations = filteredRegistrations.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // Хайлт, өдөр солигдоход эхний хуудас руу буцаах
  const handleSearchChange = (value) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const handleDateChange = (value) => {
    setSelectedDate(value);
    setCurrentPage(1);
  };

  const subjects = [
    "Харагддаг ба харагддаггүй ертөнц",
    "Бурханы бүтээл хүн",
    "Бурхан хүний холбоо",
    "Шашин бүрийн урсгал ба судар",
    "Уулзалтын ерөөл",
    "Үзэсгэлэнтэй ариун сүм",
    "Хариултаа авдаг залбирал",
    "Бурхан ба Библи",
    "Урсгалыг давсан үг",
    "Бүтээгч Бурхан, Бурханы хүүхдүүд, Тэнгэрийн хаанчлалын хөвгүүд",
    "Тэнгэр газар",
    "Үнэн ба худлыг ялгах",
    "Хүн нь ямар нэгэн бэ?",
    "Бурхан ба үгийг голчилсон итгэгч",
    "Сорилт, мэхлэлт, хавчилт ба ялалт",
  ];

  const renderSubjectOptions = () => (
    <>
      <option value="">Хичээлээ сонгоно уу</option>
      {subjects.map((subject, index) => (
        <option value={subject} key={subject}>
          {index + 1}. {subject}
        </option>
      ))}
    </>
  );

  const renderRegistrationActions = (registration) => (
    <div className="action-buttons">
      <button
        type="button"
        className="edit-button"
        onClick={() => handleEdit(registration)}
        aria-label="Бүртгэл засах"
      >
        ✏️
      </button>
      <button
        type="button"
        className="delete-button"
        onClick={() => handleDelete(registration.id)}
        aria-label="Бүртгэл устгах"
      >
        🗑️
      </button>
    </div>
  );

  const renderPagination = () => {
    if (filteredRegistrations.length === 0) return null;

    return (
      <div className="pagination">
        <p className="pagination-summary">
          {startIndex + 1}–{Math.min(
            startIndex + itemsPerPage,
            filteredRegistrations.length
          )} / {filteredRegistrations.length} бүртгэл
        </p>

        <div className="pagination-controls">
          <button
            type="button"
            className="secondary-button"
            disabled={currentPage <= 1}
            onClick={() =>
              setCurrentPage((page) => Math.max(1, page - 1))
            }
          >
            ← Өмнөх
          </button>

          {Array.from({ length: totalPages }, (_, index) => index + 1)
            .filter(
              (page) =>
                page === 1 ||
                page === totalPages ||
                Math.abs(page - currentPage) <= 1
            )
            .reduce((result, page, index, pages) => {
              if (index > 0 && page - pages[index - 1] > 1) {
                result.push("...");
              }
              result.push(page);
              return result;
            }, [])
            .map((page, index) =>
              page === "..." ? (
                <span className="pagination-ellipsis" key={`dots-${index}`}>
                  …
                </span>
              ) : (
                <button
                  type="button"
                  key={page}
                  className={
                    page === currentPage
                      ? "pagination-number active"
                      : "pagination-number"
                  }
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            )}

          <button
            type="button"
            className="secondary-button"
            disabled={currentPage >= totalPages}
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
          >
            Дараах →
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Бүртгэлийн систем</h1>
          <p>Мэдээлэл бүртгэл ба удирдлагын систем</p>
        </div>
        {isAdmin && <div className="admin-badge">🔐 Админ</div>}
      </header>

      {!showForm && !showAdmin && (
        <main className="home">
         
<div className="welcome">
  <h2>Тавтай морилно уу 👋</h2>
  <p>Бүртгэл үүсгэх эсвэл админ хэсэгт нэвтэрнэ үү.</p>
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

      {showForm && (
        <main className="card">
          <div className="card-title">
            <h2>📝 Шинэ бүртгэл</h2>
            <p>Мэдээллээ үнэн зөв бөглөнө үү.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-grid">
              <div className="form-group">
                <label>Огноо</label>
                <input
                  type="datetime-local"
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      lastName: e.target.value.replace(
                        /[^a-zA-Zа-яА-ЯөүӨҮёЁ\s]/g,
                        ""
                      ),
                    }))
                  }
                  placeholder="Овог"
                  required
                />
              </div>

              <div className="form-group">
                <label>Нэр</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      firstName: e.target.value.replace(
                        /[^a-zA-Zа-яА-ЯөүӨҮёЁ\s]/g,
                        ""
                      ),
                    }))
                  }
                  placeholder="Нэр"
                  required
                />
              </div>

              <div className="form-group">
                <label>Утасны дугаар</label>
                <input
                  type="text"
                  name="phone"
                  placeholder="99112233"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 8),
                    }))
                  }
                  inputMode="numeric"
                  maxLength={8}
                  required
                />
              </div>

              <div className="form-group full">
                <label>Хичээл</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  {renderSubjectOptions()}
                </select>
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
                disabled={isSaving}
              >
                {isSaving ? "Хадгалж байна..." : "💾 Хадгалах"}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  resetForm();
                  setShowForm(false);
                }}
              >
                ← Буцах
              </button>
            </div>
          </form>
        </main>
      )}

      {showAdmin && !isAdmin && (
        <main className="login-card">
          <div className="login-icon">🔐</div>
          <h2>Админ нэвтрэх</h2>
          <p>Админ хэсэгт нэвтрэхийн тулд нууц үгээ оруулна уу.</p>

          <form onSubmit={handleAdminLogin}>
            <input
              type="password"
              placeholder="Нууц үг"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            
<button
  type="submit"
  className="main-button"
  disabled={isLoggingIn}
>
  {isLoggingIn ? "Нэвтэрч байна..." : "Нэвтрэх"}
</button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setShowAdmin(false);
                setPassword("");
              }}
            >
              ← Буцах
            </button>
          </form>
        </main>
      )}

      {showAdmin && isAdmin && (
        <main className="admin">
          <div className="admin-top">
            <div>
              <h2>Админ хэсэг</h2>
              <p>Бүртгэлүүдийг эндээс удирдана.</p>
            </div>
            <button
              className="logout-button"
              onClick={() => {
                setIsAdmin(false);
                setShowAdmin(false);
                setSearch("");
                setSelectedDate("");
                setCurrentPage(1);
                setEditingId(null);
                resetForm();
              }}
            >
              Гарах
            </button>
          </div>

          {editingId !== null && (
            <div className="edit-card">
              <h3>✏️ Бүртгэл засах</h3>

              <form onSubmit={handleUpdate} noValidate>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Огноо</label>
                    <input
                      type="datetime-local"
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
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          lastName: e.target.value.replace(
                            /[^a-zA-Zа-яА-ЯөүӨҮёЁ\s]/g,
                            ""
                          ),
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Нэр</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          firstName: e.target.value.replace(
                            /[^a-zA-Zа-яА-ЯөүӨҮёЁ\s]/g,
                            ""
                          ),
                        }))
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Утас</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          phone: e.target.value
                            .replace(/[^0-9]/g, "")
                            .slice(0, 8),
                        }))
                      }
                      inputMode="numeric"
                      maxLength={8}
                      required
                    />
                  </div>

                  <div className="form-group full">
                    <label>Хичээл</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    >
                      {renderSubjectOptions()}
                    </select>
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
                  <button type="submit" className="main-button">
                    💾 Өөрчлөлтийг хадгалах
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => {
                      setEditingId(null);
                      resetForm();
                    }}
                  >
                    Болих
                  </button>
                </div>
              </form>
            </div>
          )}

          {editingId === null && (
            <div className="search-box">
              <input
                type="text"
                placeholder="🔎 Бүх бүртгэлээс нэр, утас, хичээлээр хайх..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />

              <div className="date-filter">
                <label htmlFor="registration-date-filter">
                  📅 Өдрөөр харах
                </label>
                <select
                  id="registration-date-filter"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                >
                  <option value="">Бүх өдөр</option>
                  {availableDates.map((date) => (
                    <option key={date} value={date}>
                      {date}
                    </option>
                  ))}
                </select>
              </div>

              <div className="export-buttons">
                <button className="excel-button" onClick={exportToExcel}>
                  📊 Excel татах
                </button>
                <button className="pdf-button" onClick={exportToPDF}>
                  📄 PDF татах
                </button>
              </div>
            </div>
          )}

          <div className="statistics">
            <div className="stat-card">
              <span>Нийт бүртгэл</span>
              <strong>{registrations.length}</strong>
            </div>
            <div className="stat-card">
              <span>Шүүлтүүрийн үр дүн</span>
              <strong>{filteredRegistrations.length}</strong>
            </div>
          </div>

          {/* Компьютерийн хүснэгт */}
          <div className="table-container">
            {filteredRegistrations.length === 0 ? (
              <div className="empty">
                <div>📭</div>
                <h3>Бүртгэл олдсонгүй</h3>
                <p>Хайлтад тохирох мэдээлэл байхгүй байна.</p>
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
                  {paginatedRegistrations.map((registration, index) => (
                    <tr key={registration.id}>
                      <td>{startIndex + index + 1}</td>
                      <td>{formatDateTime(registration.date)}</td>
                      <td>{registration.lastName}</td>
                      <td><strong>{registration.firstName}</strong></td>
                      <td>{registration.phone}</td>
                      <td>
                        <span className="subject">
                          {registration.subject}
                        </span>
                      </td>
                      <td>{registration.note || "-"}</td>
                      <td>{renderRegistrationActions(registration)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Утасны карт */}
          <div className="mobile-registration-list">
            {filteredRegistrations.length === 0 ? (
              <div className="empty">
                <div>📭</div>
                <h3>Бүртгэл олдсонгүй</h3>
                <p>Хайлтад тохирох мэдээлэл байхгүй байна.</p>
              </div>
            ) : (
              paginatedRegistrations.map((registration, index) => (
                <article
                  className="mobile-registration-card"
                  key={registration.id}
                >
                  <div className="mobile-card-heading">
                    <span className="mobile-number">
                      № {startIndex + index + 1}
                    </span>
                    <span className="subject">
                      {registration.subject}
                    </span>
                  </div>

                  <h3 className="mobile-person-name">
                    {registration.lastName} {registration.firstName}
                  </h3>

                  <div className="mobile-card-details">
                    <div className="mobile-detail">
                      <span>📅 Огноо</span>
                      <strong>{formatDateTime(registration.date)}</strong>
                    </div>
                    <div className="mobile-detail">
                      <span>📞 Утас</span>
                      <strong>{registration.phone || "-"}</strong>
                    </div>
                    <div className="mobile-detail mobile-note">
                      <span>📝 Тайлбар</span>
                      <strong>{registration.note || "-"}</strong>
                    </div>
                  </div>

                  <div className="mobile-card-actions">
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => handleEdit(registration)}
                    >
                      ✏️ Засах
                    </button>
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(registration.id)}
                    >
                      🗑️ Устгах
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          {renderPagination()}
        </main>
      )}

    
      <footer
  style={{
    display: "block",
    width: "100%",
    textAlign: "center",
    marginTop: !showForm && !showAdmin ? "20px" : "80px",
    padding: "12px 10px 20px",
    color: "#222222",
    backgroundColor: "transparent",
    fontSize: "12px",
    fontWeight: "400",
  }}
>
  © МСС МХХАлба
</footer>


      {modal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModal(null);
          }}
        >
          <div
            className={`modal-card modal-${modal.type}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-icon">
              {modal.type === "success"
                ? "✓"
                : modal.type === "error"
                  ? "!"
                  : "i"}
            </div>

            <h2>
              {modal.type === "success"
                ? "Амжилттай"
                : modal.type === "error"
                  ? "Алдаа гарлаа"
                  : modal.type === "confirm"
                    ? "Устгах уу?"
                    : "Мэдэгдэл"}
            </h2>

            <p className="modal-message">{modal.message}</p>

            <div className="modal-actions">
              {modal.type === "confirm" ? (
                <>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setModal(null)}
                  >
                    Болих
                  </button>
                  <button
                    type="button"
                    className="delete-button"
                    onClick={() => modal.onConfirm?.()}
                  >
                    Устгах
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="modal-ok"
                  onClick={() => setModal(null)}
                >
                  Ойлголоо
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;