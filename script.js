// ===== VARIABLES GLOBALES =====
let students = {};
let sheets = [];
let currentSheet = "";
let classDays = []; // Array para almacenar todos los días con asistencia registrada
let editingStudentIndex = -1;
let currentUser = null;

// ===== UTILIDADES DE SEGURIDAD =====
const SecurityUtils = {
  sanitizeString: (str) => {
    if (typeof str !== "string") return "";
    return str.trim().replace(/[<>'"&]/g, "");
  },

  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  sanitizeStudentName: (name) => {
    if (typeof name !== "string") return "";

    // Eliminar caracteres especiales pero permitir acentos y espacios
    const sanitized = name
      .trim()
      .replace(/[<>'"&\\/]/g, "") // Eliminar caracteres peligrosos
      .replace(/\s+/g, " ") // Normalizar espacios múltiples
      .substring(0, 100); // Limitar longitud

    // Validar que no sea solo espacios
    return sanitized.trim() === "" ? "" : sanitized;
  },

  validatePassword: (password) => {
    // Mínimo 6 caracteres, al menos una letra y un número
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
  },

  validateNote: (note) => {
    const num = parseFloat(note);
    return !isNaN(num) && num >= 0 && num <= 10;
  },

  validateDate: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date <= new Date();
  },
};

// ===== SISTEMA DE NOTIFICACIONES =====
function showToast(message, type = "info") {
  // Crear contenedor si no existe
  let toastContainer = document.getElementById("toast-container");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toast-container";
    toastContainer.style.position = "fixed";
    toastContainer.style.bottom = "20px";
    toastContainer.style.right = "20px";
    toastContainer.style.zIndex = "9999";
    toastContainer.style.maxWidth = "400px";
    document.body.appendChild(toastContainer);
  }

  // Determinar clase de color según el tipo
  let bgClass, icon;
  switch (type) {
    case "success":
      bgClass = "alert-success";
      icon = "fa-check-circle";
      break;
    case "error":
      bgClass = "alert-danger";
      icon = "fa-exclamation-circle";
      break;
    case "warning":
      bgClass = "alert-warning";
      icon = "fa-exclamation-triangle";
      break;
    default:
      bgClass = "alert-info";
      icon = "fa-info-circle";
  }

  const toastId = "toast-" + Date.now();
  const toast = document.createElement("div");
  toast.id = toastId;
  toast.className = `alert ${bgClass} alert-dismissible fade show mb-2`;
  toast.style.minWidth = "300px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  toast.innerHTML = `
    <i class="fas ${icon} me-2"></i>
    ${message}
    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="alert"></button>
  `;

  toastContainer.appendChild(toast);

  // Auto-eliminar después de 5 segundos
  setTimeout(() => {
    const toastElement = document.getElementById(toastId);
    if (toastElement && toastElement.parentElement) {
      toastElement.remove();
    }
  }, 3000);
}

// ===== SISTEMA DE CONFIRMACIÓN CON MODAL =====
function showConfirmation(message, confirmCallback, cancelCallback = null) {
  // Crear modal de confirmación si no existe
  let confirmModal = document.getElementById("confirmationModal");
  if (!confirmModal) {
    confirmModal = document.createElement("div");
    confirmModal.id = "confirmationModal";
    confirmModal.className = "modal fade";
    confirmModal.tabIndex = "-1";
    confirmModal.innerHTML = `
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Confirmación</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p id="confirmationMessage"></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="confirmCancelBtn">Cancelar</button>
            <button type="button" class="btn btn-danger" id="confirmOkBtn">Aceptar</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(confirmModal);
  }

  // Configurar mensaje y eventos
  document.getElementById("confirmationMessage").textContent = message;

  const modal = new bootstrap.Modal(confirmModal);
  modal.show();

  // Limpiar event listeners previos
  const okBtn = document.getElementById("confirmOkBtn");
  const cancelBtn = document.getElementById("confirmCancelBtn");

  const cleanUp = () => {
    okBtn.onclick = null;
    cancelBtn.onclick = null;
    modal.hide();
  };

  okBtn.onclick = () => {
    cleanUp();
    confirmCallback();
  };

  cancelBtn.onclick = () => {
    cleanUp();
    if (cancelCallback) cancelCallback();
  };
}

// ===== REFERENCIAS DEL DOM =====
const loginContainer = document.getElementById("login-container");
const appContainer = document.getElementById("app");
const loginForm = document.getElementById("login-form");
const registerBtn = document.getElementById("register-btn");
const googleLoginBtn = document.getElementById("google-login-btn");
const logoutBtn = document.getElementById("logout-btn");
const registerContainer = document.getElementById("register-container");
const registerForm = document.getElementById("register-form");
const backToLogin = document.getElementById("back-to-login");
const userInfo = document.getElementById("user-info");

// Referencias de la aplicación
const tableBody = document.querySelector("#studentsTable tbody");
const globalAvgEl = document.getElementById("globalAvg");
const globalAbsenceEl = document.getElementById("globalAbsence");
const totalClassDaysEl = document.getElementById("totalClassDays");
const searchBox = document.getElementById("searchBox");
const sheetsTabs = document.getElementById("sheetsTabs");
const studentSelect = document.getElementById("studentSelect");

// Botones de acción
const studentBtn = document.querySelector('[data-bs-target="#studentModal"]');
const noteBtn = document.querySelector('[data-bs-target="#noteModal"]');
const attendanceBtn = document.querySelector(
  '[data-bs-target="#attendanceModal"]'
);
const actionButtons = [studentBtn, noteBtn, attendanceBtn];

// ===== AUTENTICACIÓN =====

// Observador de estado de autenticación - VERSIÓN CORREGIDA
auth.onAuthStateChanged(async (user) => {
  console.log(
    "Estado de autenticación cambiado:",
    user ? "Usuario logueado" : "Usuario no logueado"
  );

  if (user) {
    currentUser = user;
    userInfo.textContent = `Hola, ${user.displayName || user.email}`;

    // ✅ Ocultar login y mostrar app usando clases
    loginContainer.classList.add("d-none");
    appContainer.classList.remove("d-none");
    appContainer.classList.add("d-block");

    console.log("Ocultando login, mostrando app");

    // Cargar datos del usuario desde Firestore
    await loadUserData();
    initApp();
  } else {
    currentUser = null;

    // ✅ Mostrar login y ocultar app usando clases
    loginContainer.classList.remove("d-none");
    appContainer.classList.add("d-none");
    appContainer.classList.remove("d-block");

    console.log("Mostrando login, ocultando app");

    // Limpiar datos al cerrar sesión
    resetAppData();
    resetAuthForms();
  }
});

// ===== FUNCIONES DE SEGURIDAD Y AISLAMIENTO =====

// Limpiar todos los datos de la aplicación al cerrar sesión
function resetAppData() {
  students = {};
  sheets = [];
  currentSheet = "";
  classDays = [];
  editingStudentIndex = -1;

  // Limpiar la interfaz
  tableBody.innerHTML = "";
  sheetsTabs.innerHTML = "";
  studentSelect.innerHTML = "";
  globalAvgEl.textContent = "0";
  globalAbsenceEl.textContent = "0%";
  totalClassDaysEl.textContent = "0";
}

// ===== FUNCIONES DE AUTENTICACIÓN =====

// Iniciar sesión con correo y contraseña
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  // Validar email
  if (!SecurityUtils.validateEmail(email)) {
    showAuthAlert("Por favor, introduce un email válido", "danger");
    return;
  }

  setLoading("login", true);

  try {
    await auth.signInWithEmailAndPassword(email, password);
    showAuthAlert("Inicio de sesión exitoso", "success");
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    showAuthAlert(getAuthErrorMessage(error), "danger");
  } finally {
    setLoading("login", false);
  }
});

// Registrarse con correo y contraseña
registerBtn.addEventListener("click", () => {
  loginForm.classList.add("d-none");
  registerContainer.classList.remove("d-none");
});

backToLogin.addEventListener("click", () => {
  registerContainer.classList.add("d-none");
  loginForm.classList.remove("d-none");
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    showAuthAlert("Las contraseñas no coinciden", "danger");
    return;
  }

  if (!SecurityUtils.validatePassword(password)) {
    showAuthAlert(
      "La contraseña debe tener al menos 6 caracteres, incluyendo letras y números",
      "danger"
    );
    return;
  }

  setLoading("register", true);

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    await userCredential.user.updateProfile({
      displayName: name,
    });

    // Crear estructura inicial de datos para el nuevo usuario
    await initializeUserData();
    showAuthAlert("Cuenta creada exitosamente", "success");
  } catch (error) {
    console.error("Error al registrarse:", error);
    showAuthAlert(getAuthErrorMessage(error), "danger");
  } finally {
    setLoading("register", false);
  }
});

// Iniciar sesión con Google
googleLoginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();

  try {
    const result = await auth.signInWithPopup(provider);
    // Verificar si es un usuario nuevo
    if (result.additionalUserInfo.isNewUser) {
      await initializeUserData();
    }
    showAuthAlert("Inicio de sesión con Google exitoso", "success");
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);
    showAuthAlert(getAuthErrorMessage(error), "danger");
  }
});

// Cerrar sesión
logoutBtn.addEventListener("click", () => {
  auth.signOut();
});

function setLoading(type, isLoading) {
  const submitBtn = document.getElementById(`${type}-submit-btn`);
  const text = document.getElementById(`${type}-text`);
  const spinner = document.getElementById(`${type}-spinner`);

  if (isLoading) {
    text.classList.add("d-none");
    spinner.classList.remove("d-none");
    submitBtn.disabled = true;
  } else {
    text.classList.remove("d-none");
    spinner.classList.add("d-none");
    submitBtn.disabled = false;
  }
}

function showAuthAlert(message, type) {
  const alertContainer = document.getElementById("auth-alerts");
  const alertDiv = document.createElement("div");
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  alertContainer.innerHTML = "";
  alertContainer.appendChild(alertDiv);
}

function getAuthErrorMessage(error) {
  switch (error.code) {
    case "auth/user-not-found":
      return "Usuario no encontrado";
    case "auth/wrong-password":
      return "Contraseña incorrecta";
    case "auth/email-already-in-use":
      return "El correo ya está en uso";
    case "auth/weak-password":
      return "La contraseña es demasiado débil";
    case "auth/invalid-email":
      return "Correo electrónico inválido";
    default:
      return error.message;
  }
}

function resetAuthForms() {
  loginForm.reset();
  registerForm.reset();
  document.getElementById("auth-alerts").innerHTML = "";
  registerContainer.classList.add("d-none");
  loginForm.classList.remove("d-none");
}

// ===== FIRESTORE DATABASE - CORREGIDO PARA AISLAMIENTO DE USUARIOS =====

// Inicializar datos para un nuevo usuario
async function initializeUserData() {
  if (!currentUser) return;

  const initialData = {
    students: {},
    sheets: [],
    classDays: [],
    userEmail: currentUser.email,
    userName: currentUser.displayName,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    await db.collection("users").doc(currentUser.uid).set(initialData);
    // Cargar los datos iniciales en las variables globales
    students = initialData.students;
    sheets = initialData.sheets;
    classDays = initialData.classDays;
    currentSheet = "";
  } catch (error) {
    console.error("Error inicializando datos:", error);
    throw error;
  }
}

// Cargar datos del usuario actual
// Cargar datos del usuario actual - VERSIÓN SIMPLE Y FUNCIONAL
async function loadUserData() {
  if (!currentUser) return;

  try {
    console.log("🔍 Cargando datos para usuario:", currentUser.uid);

    const userDoc = await db.collection("users").doc(currentUser.uid).get();

    if (userDoc.exists) {
      const data = userDoc.data();
      console.log("✅ Datos cargados exitosamente");

      students = data.students || {};
      sheets = data.sheets || [];
      classDays = data.classDays || [];
      currentSheet = sheets[0] || "";

      // Inicializar la aplicación
      initApp();
    } else {
      console.log("🆕 Creando datos iniciales para nuevo usuario");
      await initializeUserData();
      initApp();
    }
  } catch (error) {
    console.error("❌ Error cargando datos:", error);

    // Datos por defecto
    students = {};
    sheets = [];
    classDays = [];
    currentSheet = "";

    // Mostrar error al usuario
    showToast(
      "Error al cargar los datos. Intenta recargar la página.",
      "error"
    );
  }
}

// Guardar datos del usuario actual
async function saveUserData() {
  if (!currentUser) {
    console.error("No hay usuario autenticado para guardar datos");
    return;
  }

  try {
    // Pequeño delay para asegurar que App Check esté listo
    await new Promise((resolve) => setTimeout(resolve, 500));

    const userData = {
      students,
      sheets,
      classDays,
      lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
      userEmail: currentUser.email,
      userName: currentUser.displayName,
    };

    console.log("💾 Guardando datos para usuario:", currentUser.uid);

    await db
      .collection("users")
      .doc(currentUser.uid)
      .set(userData, { merge: true });

    console.log("✅ Datos guardados exitosamente");
  } catch (error) {
    console.error("❌ Error guardando datos:", error);

    // Reintentar una vez
    if (error.code === "permission-denied") {
      console.log("🔄 Reintentando guardar datos...");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      try {
        await db
          .collection("users")
          .doc(currentUser.uid)
          .set(userData, { merge: true });
        console.log("✅ Datos guardados en reintento");
        return;
      } catch (retryError) {
        console.error("❌ Error en reintento:", retryError);
      }
    }

    throw error;
  }
}

// ===== APLICACIÓN PRINCIPAL =====

function initApp() {
  if (currentSheet && !students[currentSheet]) {
    students[currentSheet] = [];
  }
  renderSheets();
  renderStudents();
  updateButtonsState();
}

// ===== RENDER DE PESTAÑAS =====
function renderSheets() {
  sheetsTabs.innerHTML = "";
  sheets.forEach((sheet) => {
    const li = document.createElement("li");
    li.classList.add("nav-item");

    const deleteBtn =
      sheet === currentSheet
        ? `<span class="sheet-delete ms-2" onclick="event.stopPropagation(); deleteSheet('${sheet}')">✖</span>`
        : "";

    li.innerHTML = `
      <button class="nav-link ${sheet === currentSheet ? "active" : ""}" 
        onclick="changeSheet('${sheet}')">
        ${sheet}${deleteBtn}
      </button>`;
    sheetsTabs.appendChild(li);
  });

  updateButtonsState();
}

// ===== GESTIÓN DE BOTONES =====
function updateButtonsState() {
  const hasSheet = !!currentSheet;

  actionButtons.forEach((btn) => {
    if (!btn) return;

    btn.disabled = !hasSheet;

    if (hasSheet) {
      btn.classList.remove("btn-secondary");
      if (btn === studentBtn) btn.classList.add("btn-primary");
      if (btn === noteBtn) btn.classList.add("btn-success");
      if (btn === attendanceBtn) btn.classList.add("btn-warning");
      btn.setAttribute("data-bs-toggle", "modal");
    } else {
      btn.classList.remove("btn-primary", "btn-success", "btn-warning");
      btn.classList.add("btn-secondary");
      btn.removeAttribute("data-bs-toggle");
    }
  });
}

// ===== CAMBIAR HOJA =====
function changeSheet(sheet) {
  currentSheet = sheet;
  if (!students[currentSheet]) students[currentSheet] = [];
  renderSheets();
  renderStudents();
  updateButtonsState();
}

// ===== ELIMINAR HOJA =====
async function deleteSheet(sheetName) {
  showConfirmation(
    `¿Estás seguro de eliminar la hoja "${sheetName}" y todos sus datos?`,
    async () => {
      sheets = sheets.filter((s) => s !== sheetName);
      delete students[sheetName];
      currentSheet = sheets[0] || "";

      try {
        await saveUserData();
        renderSheets();
        renderStudents(searchBox.value);
        updateButtonsState();
        showToast("Hoja eliminada correctamente", "success");
      } catch (error) {
        console.error("Error eliminando hoja:", error);
        showToast("Error al eliminar la hoja", "error");
      }
    }
  );
}

// ===== CALCULAR DÍAS DE CLASE =====
function calculateClassDays() {
  const allDates = new Set();
  Object.values(students).forEach((sheetStudents) => {
    sheetStudents.forEach((student) => {
      Object.keys(student.asistencia || {}).forEach((date) => {
        allDates.add(date);
      });
    });
  });
  return Array.from(allDates).sort();
}

// ===== RENDER DE ESTUDIANTES =====
function renderStudents(filter = "") {
  tableBody.innerHTML = "";

  if (!currentSheet) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5">
          <div class="empty-state">
            <div>
              <h3 class="text-muted">📄 No hay hoja seleccionada</h3>
              <p class="text-muted">Crea una nueva hoja para comenzar</p>
              <button class="btn btn-primary" onclick="document.getElementById('newSheet').click()">
                <i class="fas fa-plus"></i> Crear Primera Hoja
              </button>
            </div>
          </div>
        </td>
      </tr>`;
    globalAvgEl.textContent = "0";
    globalAbsenceEl.textContent = "0%";
    totalClassDaysEl.textContent = "0";
    updateStudentSelect();
    updateButtonsState();
    return;
  }

  const alumnos = students[currentSheet] || [];

  if (alumnos.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5">
          <div class="empty-state">
            <div>
              <h3 class="text-muted">👥 No hay estudiantes</h3>
              <p class="text-muted">Añade estudiantes a esta hoja</p>
              <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#studentModal">
                <i class="fas fa-plus"></i> Añadir Primer Estudiante
              </button>
            </div>
          </div>
        </td>
      </tr>`;
    globalAvgEl.textContent = "0";
    globalAbsenceEl.textContent = "0%";
    totalClassDaysEl.textContent = "0";
    updateStudentSelect();
    updateButtonsState();
    return;
  }

  let totalNotas = 0,
    totalAlumnos = 0,
    totalFaltasNoJustificadas = 0;

  // Calcular días de clase (todas las fechas únicas de asistencia)
  const classDays = calculateClassDays();
  const totalDiasClase = classDays.length;

  alumnos
    .filter((st) => st.nombre.toLowerCase().includes(filter.toLowerCase()))
    .forEach((st, idx) => {
      // Calcular media solo si hay notas
      let media = "";
      let mediaNum = 0;
      let trClass = "";

      if (st.notas.length > 0) {
        mediaNum = st.notas.reduce((a, b) => a + b, 0) / st.notas.length;
        media = mediaNum.toFixed(2);

        // Aplicar semáforo de rendimiento basado en la media
        if (mediaNum < 5) {
          trClass = "tr-rojo";
        } else if (mediaNum < 7) {
          trClass = "tr-amarillo";
        } else {
          trClass = "tr-verde";
        }

        totalNotas += mediaNum;
        totalAlumnos++;
      }

      const asistencia = st.asistencia || {};

      // Calcular estadísticas de asistencia
      const faltas = Object.values(asistencia).filter(
        (a) => a === "falta"
      ).length;
      const faltasJustificadas = Object.values(asistencia).filter(
        (a) => a === "falta-justificada"
      ).length;
      const retrasos = Object.values(asistencia).filter(
        (a) => a === "retraso"
      ).length;

      totalFaltasNoJustificadas += faltas;

      // Calcular porcentaje de faltas basado en el total de días de clase
      const porcentajeFaltasAlumno =
        totalDiasClase > 0 ? ((faltas / totalDiasClase) * 100).toFixed(1) : 0;

      const tr = document.createElement("tr");

      // CORRECCIÓN: Aplicar la clase del semáforo directamente
      if (trClass) {
        tr.className = trClass;
      }

      tr.innerHTML = `
        <td>${st.nombre}</td>
        <td>${st.notas.join(", ") || "Sin notas"}</td>
        <td><strong>${media || "-"}</strong></td>
        <td>${faltas} ${
        faltasJustificadas > 0 ? `(${faltasJustificadas} just.)` : ""
      }</td>
        <td>${retrasos}</td>
        <td><span class="badge ${
          porcentajeFaltasAlumno > 20 ? "bg-danger" : "bg-warning"
        }">${porcentajeFaltasAlumno}%</span></td>
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="editStudent(${idx})" title="Editar">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteStudent(${idx})" title="Eliminar">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

  // Estadísticas globales - solo contar alumnos con notas para la media global
  const alumnosConNotas = alumnos.filter((st) => st.notas.length > 0).length;
  globalAvgEl.textContent = alumnosConNotas
    ? (totalNotas / alumnosConNotas).toFixed(2)
    : "0";

  // Calcular porcentaje global de faltas basado en el total de días de clase
  const porcentajeFaltasGlobal =
    totalAlumnos && totalDiasClase
      ? (
          (totalFaltasNoJustificadas / (totalAlumnos * totalDiasClase)) *
          100
        ).toFixed(1)
      : 0;
  globalAbsenceEl.textContent = `${porcentajeFaltasGlobal}%`;
  totalClassDaysEl.textContent = totalDiasClase;

  updateStudentSelect();
}

// ===== ACTUALIZAR SELECT DE ESTUDIANTES =====
function updateStudentSelect() {
  studentSelect.innerHTML = "";
  if (!currentSheet) return;

  const optionDefault = document.createElement("option");
  optionDefault.textContent = "Selecciona un estudiante";
  optionDefault.value = "";
  optionDefault.disabled = true;
  optionDefault.selected = true;
  studentSelect.appendChild(optionDefault);

  (students[currentSheet] || []).forEach((st, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = st.nombre;
    studentSelect.appendChild(opt);
  });
}

// ===== AÑADIR ESTUDIANTE - VERSIÓN SEGURA =====
document.getElementById("saveStudent").onclick = async () => {
  if (!currentSheet) {
    showToast(
      "Debes crear o seleccionar una hoja antes de añadir estudiantes.",
      "warning"
    );
    return;
  }

  const rawName = document.getElementById("nameInput").value;
  const nombre = SecurityUtils.sanitizeStudentName(rawName);

  if (!nombre) {
    showToast("El nombre no puede estar vacío", "error");
    return;
  }

  // Verificar duplicados
  const isDuplicate = students[currentSheet].some(
    (student) => student.nombre.toLowerCase() === nombre.toLowerCase()
  );

  if (isDuplicate) {
    showToast("Ya existe un estudiante con ese nombre", "error");
    return;
  }

  students[currentSheet].push({
    nombre,
    notas: [],
    asistencia: {},
  });

  try {
    await saveUserData();
    renderStudents(searchBox.value);
    bootstrap.Modal.getInstance(document.getElementById("studentModal")).hide();
    document.getElementById("nameInput").value = "";
    showToast("Estudiante añadido correctamente", "success");
  } catch (error) {
    console.error("Error guardando estudiante:", error);
    showToast("Error al guardar el estudiante", "error");
  }
};

// ===== AÑADIR NOTA =====
// ===== AÑADIR NOTA - VERSIÓN SEGURA =====
document.getElementById("saveNote").onclick = async () => {
  if (!currentSheet) {
    showToast(
      "Debes crear o seleccionar una hoja antes de añadir notas.",
      "warning"
    );
    return;
  }

  const idx = studentSelect.value;
  const notaInput = document.getElementById("noteInput").value;

  if (idx === "") {
    showToast("Selecciona un estudiante", "error");
    return;
  }

  if (!SecurityUtils.validateNote(notaInput)) {
    showToast("La nota debe ser un número entre 0 y 10", "error");
    return;
  }

  const nota = parseFloat(notaInput);
  students[currentSheet][idx].notas.push(nota);

  try {
    await saveUserData();
    renderStudents(searchBox.value);
    bootstrap.Modal.getInstance(document.getElementById("noteModal")).hide();
    document.getElementById("noteInput").value = "";
    showToast("Nota añadida correctamente", "success");
  } catch (error) {
    console.error("Error guardando nota:", error);
    showToast("Error al guardar la nota", "error");
  }
};

// ===== ELIMINAR ESTUDIANTE =====
async function deleteStudent(idx) {
  if (!currentSheet) return;

  const studentName = students[currentSheet][idx].nombre;
  showConfirmation(
    `¿Estás seguro de eliminar al estudiante "${studentName}"?`,
    async () => {
      students[currentSheet].splice(idx, 1);

      try {
        await saveUserData();
        renderStudents(searchBox.value);
        showToast("Estudiante eliminado correctamente", "success");
      } catch (error) {
        console.error("Error eliminando estudiante:", error);
        showToast("Error al eliminar el estudiante", "error");
      }
    }
  );
}

// ===== BUSCAR =====
searchBox.addEventListener("input", () => renderStudents(searchBox.value));

// ===== CREAR NUEVA HOJA =====
document.getElementById("newSheet").onclick = async () => {
  // Crear modal para nombre de hoja
  let sheetModal = document.getElementById("newSheetModal");
  if (!sheetModal) {
    sheetModal = document.createElement("div");
    sheetModal.id = "newSheetModal";
    sheetModal.className = "modal fade";
    sheetModal.tabIndex = "-1";
    sheetModal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Nueva Hoja</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <input type="text" id="newSheetName" class="form-control" placeholder="Nombre de la nueva hoja" maxlength="50">
            <div class="invalid-feedback" id="sheetNameError"></div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary" id="createSheetBtn">Crear</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(sheetModal);
  }

  const modal = new bootstrap.Modal(sheetModal);
  modal.show();

  document.getElementById("newSheetName").value = "";
  document.getElementById("newSheetName").classList.remove("is-invalid");

  const createSheet = async () => {
    const name = SecurityUtils.sanitizeString(
      document.getElementById("newSheetName").value.trim()
    );

    if (!name) {
      document.getElementById("newSheetName").classList.add("is-invalid");
      document.getElementById("sheetNameError").textContent =
        "El nombre no puede estar vacío";
      return;
    }

    if (sheets.includes(name)) {
      document.getElementById("newSheetName").classList.add("is-invalid");
      document.getElementById("sheetNameError").textContent =
        "Ya existe una hoja con ese nombre";
      return;
    }

    sheets.push(name);
    students[name] = [];

    modal.hide();

    try {
      await saveUserData();
      changeSheet(name);
      showToast("Hoja creada correctamente", "success");
    } catch (error) {
      console.error("Error creando hoja:", error);
      showToast("Error al crear la hoja", "error");
    }
  };

  document.getElementById("createSheetBtn").onclick = createSheet;
  document.getElementById("newSheetName").onkeypress = (e) => {
    if (e.key === "Enter") createSheet();
  };
};
// ===== GESTIÓN DE ASISTENCIA MEJORADA =====

// Función para verificar si ya existe asistencia para una fecha
function checkExistingAttendance(date) {
  const classDays = calculateClassDays();
  return classDays.includes(date);
}

// Función para abrir el modal de asistencia
attendanceBtn.onclick = () => {
  if (!currentSheet) {
    alert(
      "⚠️ Debes crear o seleccionar una hoja antes de registrar asistencia."
    );
    return;
  }

  const attendanceTableBody = document.querySelector("#attendanceTable tbody");
  attendanceTableBody.innerHTML = "";

  // Establecer fecha actual por defecto
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("attendanceDate");
  dateInput.value = today;

  // Verificar si ya existe asistencia para esta fecha
  if (checkExistingAttendance(today)) {
    showDateWarning(true);
  } else {
    showDateWarning(false);
  }

  (students[currentSheet] || []).forEach((student, index) => {
    const row = document.createElement("tr");
    const currentDate = dateInput.value;
    const currentStatus = student.asistencia?.[currentDate] || "asistio";

    row.innerHTML = `
      <td>${student.nombre}</td>
      <td>
        <input type="radio" name="attendance-${index}" value="asistio" 
               ${currentStatus === "asistio" ? "checked" : ""} 
               class="attendance-option" data-index="${index}">
      </td>
      <td>
        <input type="radio" name="attendance-${index}" value="falta"
               ${currentStatus === "falta" ? "checked" : ""}
               class="attendance-option" data-index="${index}">
      </td>
      <td>
        <input type="radio" name="attendance-${index}" value="retraso"
               ${currentStatus === "retraso" ? "checked" : ""}
               class="attendance-option" data-index="${index}">
      </td>
    `;
    attendanceTableBody.appendChild(row);
  });

  // Agregar listener para verificar duplicados al cambiar fecha
  dateInput.addEventListener("change", function () {
    if (checkExistingAttendance(this.value)) {
      showDateWarning(true);

      // Actualizar los estados según la asistencia ya registrada
      (students[currentSheet] || []).forEach((student, index) => {
        const status = student.asistencia?.[this.value] || "asistio";
        const radio = document.querySelector(
          `input[name="attendance-${index}"][value="${status}"]`
        );
        if (radio) radio.checked = true;
      });
    } else {
      showDateWarning(false);

      // Resetear todos a "asistió" para nueva fecha
      document
        .querySelectorAll('.attendance-option[value="asistio"]')
        .forEach((radio) => {
          radio.checked = true;
        });
    }
  });
};

// Función para mostrar/ocultar advertencia de fecha duplicada
function showDateWarning(show) {
  // Crear o actualizar el elemento de advertencia
  let warningElement = document.getElementById("dateWarning");
  if (!warningElement) {
    warningElement = document.createElement("div");
    warningElement.id = "dateWarning";
    warningElement.className = "alert alert-warning mt-2";
    document
      .getElementById("attendanceDate")
      .parentNode.appendChild(warningElement);
  }

  if (show) {
    warningElement.innerHTML = `
      <i class="fas fa-exclamation-triangle"></i>
      Ya existe asistencia registrada para esta fecha. Al guardar, se actualizarán los registros existentes.
    `;
    warningElement.classList.remove("d-none");
  } else {
    warningElement.classList.add("d-none");
  }
}

// Guardar asistencia
document.getElementById("saveAttendance").onclick = async () => {
  if (!currentSheet) return;

  const fecha = document.getElementById("attendanceDate").value;
  if (!fecha) {
    showToast("Por favor, selecciona una fecha.", "error");
    return;
  }

  // Validar fecha
  if (!SecurityUtils.validateDate(fecha)) {
    showToast("La fecha seleccionada no es válida", "error");
    return;
  }

  // Actualizar la asistencia de cada estudiante
  let hasChanges = false;
  document.querySelectorAll(".attendance-option").forEach((radio) => {
    if (radio.checked) {
      const index = radio.getAttribute("data-index");
      const status = radio.value;

      if (!students[currentSheet][index].asistencia) {
        students[currentSheet][index].asistencia = {};
      }

      // Solo guardar si el estado es diferente del actual
      const currentStatus = students[currentSheet][index].asistencia[fecha];
      if (currentStatus !== status) {
        students[currentSheet][index].asistencia[fecha] = status;
        hasChanges = true;
      }
    }
  });

  if (hasChanges) {
    try {
      await saveUserData();
      renderStudents(searchBox.value);
      bootstrap.Modal.getInstance(
        document.getElementById("attendanceModal")
      ).hide();
      showToast("Asistencia guardada correctamente", "success");
    } catch (error) {
      console.error("Error guardando asistencia:", error);
      showToast("Error al guardar la asistencia", "error");
    }
  } else {
    bootstrap.Modal.getInstance(
      document.getElementById("attendanceModal")
    ).hide();
    showToast("No se realizaron cambios en la asistencia", "info");
  }
};

// ===== FUNCIONES DE EDICIÓN DE ESTUDIANTES MEJORADAS =====
function editStudent(index) {
  if (!currentSheet) return;

  editingStudentIndex = index;
  const student = students[currentSheet][index];

  document.getElementById("editStudentName").value = student.nombre;

  // Llenar notas
  const notesContainer = document.getElementById("editNotesContainer");
  notesContainer.innerHTML = "";
  student.notas.forEach((note, noteIndex) => {
    addNoteField(note, noteIndex);
  });

  // Llenar asistencia por fecha - MOSTRAR TODOS LOS DÍAS DE CLASE
  const attendanceContainer = document.getElementById(
    "editAttendanceContainer"
  );
  attendanceContainer.innerHTML = "";

  const classDays = calculateClassDays();
  classDays.forEach((fecha) => {
    const status = student.asistencia?.[fecha] || "asistio";
    addAttendanceField(fecha, status);
  });

  const editModal = new bootstrap.Modal(
    document.getElementById("editStudentModal")
  );
  editModal.show();
}

function addNoteField(value = "", index = null) {
  const container = document.getElementById("editNotesContainer");
  const noteId = index !== null ? index : Date.now();

  const noteDiv = document.createElement("div");
  noteDiv.className = "input-group mb-2";
  noteDiv.innerHTML = `
    <input type="number" class="form-control note-input" 
           value="${value}" step="0.01" min="0" max="10" 
           placeholder="Nota (0-10)" data-index="${noteId}">
    <button class="btn btn-outline-danger" type="button" onclick="removeNoteField(this)">
      <i class="fas fa-trash"></i>
    </button>
  `;
  container.appendChild(noteDiv);
}

function removeNoteField(button) {
  button.parentElement.remove();
}

function addAttendanceField(fecha, status = "asistio") {
  const container = document.getElementById("editAttendanceContainer");

  const attendanceDiv = document.createElement("div");
  attendanceDiv.className = "row mb-2 align-items-center";
  attendanceDiv.innerHTML = `
    <div class="col-md-4">
      <label class="form-label">${fecha}</label>
    </div>
    <div class="col-md-6">
      <select class="form-select attendance-status" data-date="${fecha}">
        <option value="asistio" ${
          status === "asistio" ? "selected" : ""
        }>Asistió</option>
        <option value="falta" ${
          status === "falta" ? "selected" : ""
        }>Falta</option>
        <option value="falta-justificada" ${
          status === "falta-justificada" ? "selected" : ""
        }>Falta Justificada</option>
        <option value="retraso" ${
          status === "retraso" ? "selected" : ""
        }>Retraso</option>
      </select>
    </div>
    <div class="col-md-2">
      <button class="btn btn-outline-danger btn-sm" type="button" onclick="removeAttendanceField('${fecha}')">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  `;
  container.appendChild(attendanceDiv);
}

function removeAttendanceField(fecha) {
  const student = students[currentSheet][editingStudentIndex];
  if (student.asistencia && student.asistencia[fecha]) {
    delete student.asistencia[fecha];
  }
  // Volver a renderizar el modal para reflejar el cambio
  editStudent(editingStudentIndex);
}

document.getElementById("saveEditStudent").onclick = async () => {
  if (!currentSheet || editingStudentIndex === -1) return;

  const student = students[currentSheet][editingStudentIndex];

  // Actualizar nombre
  const rawName = document.getElementById("editStudentName").value;
  const newName = SecurityUtils.sanitizeStudentName(rawName);

  if (!newName) {
    showToast("El nombre no puede estar vacío", "error");
    return;
  }

  student.nombre = newName;

  // Actualizar notas
  student.notas = [];
  let hasInvalidNote = false;
  document.querySelectorAll(".note-input").forEach((input) => {
    const value = parseFloat(input.value);
    if (!isNaN(value) && value >= 0 && value <= 10) {
      student.notas.push(value);
    } else if (input.value.trim() !== "") {
      hasInvalidNote = true;
    }
  });

  if (hasInvalidNote) {
    showToast("Algunas notas no eran válidas y fueron ignoradas", "warning");
  }

  // Actualizar asistencia
  document.querySelectorAll(".attendance-status").forEach((select) => {
    const fecha = select.getAttribute("data-date");
    const status = select.value;

    if (!student.asistencia) {
      student.asistencia = {};
    }

    if (status === "asistio") {
      delete student.asistencia[fecha];
    } else {
      student.asistencia[fecha] = status;
    }
  });

  try {
    await saveUserData();
    renderStudents(searchBox.value);
    bootstrap.Modal.getInstance(
      document.getElementById("editStudentModal")
    ).hide();
    editingStudentIndex = -1;
    showToast("Estudiante actualizado correctamente", "success");
  } catch (error) {
    console.error("Error guardando cambios:", error);
    showToast("Error al guardar los cambios", "error");
  }
};

// ===== TEMA OSCURO/CLARO =====
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("dark-theme");
};

// ===== INTERNACIONALIZACIÓN =====
document.getElementById("langToggle").onclick = () => {
  alert("Funcionalidad de cambio de idioma por implementar");
};
