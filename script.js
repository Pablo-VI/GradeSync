/* ==========================================================================
   TABLA DE CONTENIDOS
   ==========================================================================
   1. ESTADO GLOBAL Y CONFIGURACIÓN
      - Variables Globales
      - Referencias del DOM
      - Gestor de Errores Global

   2. INICIALIZACIÓN Y CICLO DE VIDA
      - Evento DOMContentLoaded
      - initApp
      - resetAppData

   3. AUTENTICACIÓN (FIREBASE AUTH)
      - Observador de Estado (onAuthStateChanged)
      - Funciones de Login, Registro y Logout
      - Funciones de UI de Autenticación (setLoading, alerts, etc.)

   4. PERSISTENCIA DE DATOS (FIRESTORE)
      - Inicialización de Datos de Usuario
      - Carga de Datos de Usuario
      - Guardado de Datos de Usuario (con reintentos)
      - Manejo de Errores de Firestore

   5. LÓGICA DE LA APLICACIÓN Y CARACTERÍSTICAS
      - Gestión de Hojas (Sheets)
      - Gestión de Estudiantes
      - Gestión de Notas
      - Gestión de Asistencia
      - Ordenación de la Tabla
      - Gráfico de Notas

   6. RENDERIZADO Y MANIPULACIÓN DEL DOM
      - renderStudents
      - renderSheets
      - updateStudentSelect
      - updateButtonsState
      - updateSortUI
      - showDateWarning (Asistencia)

   7. UTILIDADES
      - Internacionalización (i18n)
      - Utilidades de Seguridad
      - Validación de Datos
      - Componentes de UI (Modales, Toasts, Overlays de Carga/Error)
   ========================================================================== */

/* ==========================================================================
   1. ESTADO GLOBAL Y CONFIGURACIÓN
   ========================================================================== */

// --- Variables Globales ---
let students = {};
let sheets = [];
let currentSheet = "";
let classDays = [];
let editingStudentIndex = -1;
let currentUser = null;
let sortState = {
  column: "nombre",
  direction: "asc",
};
let notesChart = null; // Gráfico de notas

// --- Referencias del DOM ---
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
const tableBody = document.querySelector("#studentsTable tbody");
const globalAvgEl = document.getElementById("globalAvg");
const globalAbsenceEl = document.getElementById("globalAbsence");
const totalClassDaysEl = document.getElementById("totalClassDays");
const searchBox = document.getElementById("searchBox");
const sheetsTabs = document.getElementById("sheetsTabs");
const studentSelect = document.getElementById("studentSelect");
const studentBtn = document.querySelector('[data-bs-target="#studentModal"]');
const noteBtn = document.querySelector('[data-bs-target="#noteModal"]');
const attendanceBtn = document.querySelector(
  '[data-bs-target="#attendanceModal"]'
);
const actionButtons = [studentBtn, noteBtn, attendanceBtn];

// --- Gestor de Errores Global ---
window.addEventListener("error", function (event) {
  console.error("Error global no capturado:", event.error);
  ErrorStates.showErrorState(
    "Ha ocurrido un error inesperado en la aplicación."
  );
});
window.addEventListener("unhandledrejection", function (event) {
  console.error("Promesa rechazada no controlada:", event.reason);
  ErrorStates.showErrorState(
    "Ha ocurrido un error inesperado en una operación asíncrona."
  );
});

/* ==========================================================================
   2. INICIALIZACIÓN Y CICLO DE VIDA
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  setLanguage(currentLang);
});

function initApp() {
  if (currentSheet && !students[currentSheet]) {
    students[currentSheet] = [];
  }
  renderSheets();
  initSorting();
  renderStudents();
  updateButtonsState();
}

function resetAppData() {
  students = {};
  sheets = [];
  currentSheet = "";
  classDays = [];
  editingStudentIndex = -1;
  tableBody.innerHTML = "";
  sheetsTabs.innerHTML = "";
  studentSelect.innerHTML = "";
  globalAvgEl.textContent = "0";
  globalAbsenceEl.textContent = "0%";
  totalClassDaysEl.textContent = "0";
}

/* ==========================================================================
   3. AUTENTICACIÓN (FIREBASE AUTH)
   ========================================================================== */

auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    userInfo.textContent = `${translate("hello")}, ${
      user.displayName || user.email
    }`;
    loginContainer.classList.add("d-none");
    appContainer.classList.remove("d-none");
    appContainer.classList.add("d-block");
    setLanguage(currentLang);
    await loadUserData();
  } else {
    currentUser = null;
    loginContainer.classList.remove("d-none");
    appContainer.classList.add("d-none");
    appContainer.classList.remove("d-block");
    setLanguage(currentLang);
    resetAppData();
    resetAuthForms();
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;
  if (!SecurityUtils.validateEmail(email)) {
    showAuthAlert(translate("invalidEmail"), "danger");
    return;
  }
  setLoading("login", true);
  try {
    await auth.signInWithEmailAndPassword(email, password);
    showAuthAlert(translate("loginSuccess"), "success");
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    showAuthAlert(getAuthErrorMessage(error), "danger");
  } finally {
    setLoading("login", false);
  }
});

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("register-name").value;
  const email = document.getElementById("register-email").value;
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById("confirm-password").value;

  if (password !== confirmPassword) {
    showAuthAlert(translate("passwordsMismatch"), "danger");
    return;
  }
  if (!SecurityUtils.validatePassword(password)) {
    showAuthAlert(translate("passwordRequirements"), "danger");
    return;
  }
  setLoading("register", true);
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password
    );
    await userCredential.user.updateProfile({ displayName: name });
    await initializeUserData();
    showAuthAlert(translate("accountCreated"), "success");
  } catch (error) {
    console.error("Error al registrarse:", error);
    showAuthAlert(getAuthErrorMessage(error), "danger");
  } finally {
    setLoading("register", false);
  }
});

googleLoginBtn.addEventListener("click", async () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  try {
    const result = await auth.signInWithPopup(provider);
    if (result.additionalUserInfo.isNewUser) {
      await initializeUserData();
    }
    showAuthAlert(translate("googleLoginSuccess"), "success");
  } catch (error) {
    console.error("Error al iniciar sesión con Google:", error);
    showAuthAlert(getAuthErrorMessage(error), "danger");
  }
});

logoutBtn.addEventListener("click", () => auth.signOut());

registerBtn.addEventListener("click", () => {
  loginForm.classList.add("d-none");
  registerContainer.classList.remove("d-none");
});

backToLogin.addEventListener("click", () => {
  registerContainer.classList.add("d-none");
  loginForm.classList.remove("d-none");
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
  alertContainer.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show mt-3">${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`;
}

function getAuthErrorMessage(error) {
  return translate(error.code) || error.message;
}

function resetAuthForms() {
  loginForm.reset();
  registerForm.reset();
  document.getElementById("auth-alerts").innerHTML = "";
  registerContainer.classList.add("d-none");
  loginForm.classList.remove("d-none");
}

/* ==========================================================================
   4. PERSISTENCIA DE DATOS (FIRESTORE)
   ========================================================================== */

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
    students = initialData.students;
    sheets = initialData.sheets;
    classDays = initialData.classDays;
    currentSheet = "";
  } catch (error) {
    console.error("Error inicializando datos:", error);
    throw error;
  }
}

async function loadUserData() {
  if (!currentUser) return;
  ErrorStates.showLoadingState(translate("loadingData"));
  try {
    const userDoc = await db.collection("users").doc(currentUser.uid).get();
    if (userDoc.exists) {
      const data = userDoc.data();
      if (DataValidation.validateUserData(data)) {
        students = data.students || {};
        sheets = data.sheets || [];
        classDays = data.classDays || [];
        currentSheet = sheets[0] || "";
      } else {
        console.warn("Datos corruptos detectados. Reinicializando...");
        showToast(translate("inconsistentData"), "warning");
        await initializeUserData();
      }
    } else {
      await initializeUserData();
    }
    initApp();
  } catch (error) {
    console.error("Error cargando datos:", error);
    showToast(translate("loadError"), "error");
    students = {};
    sheets = [];
    classDays = [];
    currentSheet = "";
  } finally {
    ErrorStates.hideLoadingState();
  }
}

async function saveUserData() {
  if (!currentUser) {
    console.error("No hay usuario autenticado para guardar datos");
    return;
  }
  return await saveUserDataWithRetry();
}

async function saveUserDataWithRetry(maxRetries = 3) {
  if (!currentUser) return;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
      const userData = {
        students,
        sheets,
        classDays,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        userEmail: currentUser.email,
        userName: currentUser.displayName,
      };
      await db
        .collection("users")
        .doc(currentUser.uid)
        .set(userData, { merge: true });
      return;
    } catch (error) {
      console.error(`Error en intento ${attempt} de guardado:`, error);
      if (attempt === maxRetries) {
        if (error.code === "failed-precondition")
          throw new Error(translate("permissionError"));
        else if (error.code === "unavailable")
          throw new Error(translate("offlineError"));
        else throw error;
      }
    }
  }
}

function handleFirestoreError(error, operationType) {
  console.error(`Error durante la operación (${operationType}):`, error);
  if (
    error.message.includes("offline") ||
    error.message.includes("NETWORK_ERROR")
  ) {
    showToast(translate("studentSavedLocally"), "warning");
  } else {
    showToast(translate("studentSaveError", error.message), "error");
  }
}

/* ==========================================================================
   5. LÓGICA DE LA APLICACIÓN Y CARACTERÍSTICAS
   ========================================================================== */

// --- Gestión de Hojas (Sheets) ---
function changeSheet(sheet) {
  currentSheet = sheet;
  if (!students[currentSheet]) students[currentSheet] = [];
  sortState = { column: "nombre", direction: "asc" };
  renderSheets();
  applySorting();
  updateSortUI();
  renderStudents();
  updateButtonsState();
}

document.getElementById("newSheet").onclick = async () => {
  let sheetModal = document.getElementById("newSheetModal");
  if (!sheetModal) {
    sheetModal = document.createElement("div");
    sheetModal.id = "newSheetModal";
    sheetModal.className = "modal fade";
    sheetModal.innerHTML = `
      <div class="modal-dialog"><div class="modal-content">
        <div class="modal-header"><h5 class="modal-title">${translate(
          "newSheetModalTitle"
        )}</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">
          <input type="text" id="newSheetName" class="form-control" placeholder="${translate(
            "newSheetPlaceholder"
          )}" maxlength="50">
          <div class="invalid-feedback" id="sheetNameError"></div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${translate(
            "cancelButton"
          )}</button>
          <button type="button" class="btn btn-primary" id="createSheetBtn">${translate(
            "createAccountButton"
          )}</button>
        </div>
      </div></div>`;
    document.body.appendChild(sheetModal);
  }
  const modal = new bootstrap.Modal(sheetModal);
  const nameInput = document.getElementById("newSheetName");
  nameInput.value = "";
  nameInput.classList.remove("is-invalid");
  modal.show();

  const createSheet = async () => {
    const name = SecurityUtils.sanitizeString(nameInput.value.trim());
    if (!name) {
      nameInput.classList.add("is-invalid");
      document.getElementById("sheetNameError").textContent =
        translate("sheetNameEmpty");
      return;
    }
    if (sheets.includes(name)) {
      nameInput.classList.add("is-invalid");
      document.getElementById("sheetNameError").textContent =
        translate("sheetNameExists");
      return;
    }
    sheets.push(name);
    students[name] = [];
    modal.hide();
    try {
      await saveUserData();
      changeSheet(name);
      showToast(translate("sheetCreated"), "success");
    } catch (error) {
      handleFirestoreError(error, "createSheet");
    }
  };
  document.getElementById("createSheetBtn").onclick = createSheet;
  nameInput.onkeypress = (e) => {
    if (e.key === "Enter") createSheet();
  };
};

async function deleteSheet(sheetName) {
  showConfirmation(translate("confirmDeleteSheet", sheetName), async () => {
    sheets = sheets.filter((s) => s !== sheetName);
    delete students[sheetName];
    currentSheet = sheets[0] || "";
    try {
      await saveUserData();
      renderSheets();
      renderStudents(searchBox.value);
      updateButtonsState();
      showToast(translate("sheetDeleted"), "success");
    } catch (error) {
      handleFirestoreError(error, "deleteSheet");
    }
  });
}

// --- Gestión de Estudiantes ---
document.getElementById("saveStudent").onclick = async () => {
  if (!currentSheet) {
    showToast(translate("addStudentSheetWarning"), "warning");
    return;
  }
  const nameInput = document.getElementById("nameInput");
  const nombre = SecurityUtils.sanitizeStudentName(nameInput.value);
  if (!nombre) {
    showToast(translate("studentNameEmpty"), "error");
    return;
  }
  if (
    students[currentSheet].some(
      (st) => st.nombre.toLowerCase() === nombre.toLowerCase()
    )
  ) {
    showToast(translate("studentNameDuplicate"), "error");
    return;
  }
  students[currentSheet].push({ nombre, notas: [], asistencia: {} });
  try {
    await saveUserData();
    renderStudents(searchBox.value);
    bootstrap.Modal.getInstance(document.getElementById("studentModal")).hide();
    nameInput.value = "";
    showToast(translate("studentAdded"), "success");
  } catch (error) {
    handleFirestoreError(error, "saveStudent");
  }
};

async function deleteStudent(idx) {
  if (!currentSheet) return;
  const studentName = students[currentSheet][idx].nombre;
  showConfirmation(translate("confirmDeleteStudent", studentName), async () => {
    students[currentSheet].splice(idx, 1);
    try {
      await saveUserData();
      renderStudents(searchBox.value);
      showToast(translate("studentDeleted"), "success");
    } catch (error) {
      handleFirestoreError(error, "deleteStudent");
    }
  });
}

function editStudent(index) {
  if (!currentSheet) return;
  editingStudentIndex = index;
  const student = students[currentSheet][index];

  document.getElementById("editStudentName").value = student.nombre;

  const notesContainer = document.getElementById("editNotesContainer");
  notesContainer.innerHTML = "";
  student.notas.forEach((note, noteIndex) => addNoteField(note, noteIndex));

  const attendanceContainer = document.getElementById(
    "editAttendanceContainer"
  );
  attendanceContainer.innerHTML = "";
  calculateClassDays().forEach((fecha) => {
    addAttendanceField(fecha, student.asistencia?.[fecha] || "asistio");
  });

  new bootstrap.Modal(document.getElementById("editStudentModal")).show();
}

document.getElementById("saveEditStudent").onclick = async () => {
  if (!currentSheet || editingStudentIndex === -1) return;
  const student = students[currentSheet][editingStudentIndex];

  const newName = SecurityUtils.sanitizeStudentName(
    document.getElementById("editStudentName").value
  );
  if (!newName) {
    showToast(translate("studentNameEmpty"), "error");
    return;
  }
  student.nombre = newName;

  let hasInvalidNote = false;
  student.notas = [];
  document.querySelectorAll(".note-input").forEach((input) => {
    const value = parseFloat(input.value);
    if (SecurityUtils.validateNote(value)) {
      student.notas.push(value);
    } else if (input.value.trim() !== "") {
      hasInvalidNote = true;
    }
  });
  if (hasInvalidNote) showToast(translate("invalidNotesIgnored"), "warning");

  document.querySelectorAll(".attendance-status").forEach((select) => {
    const fecha = select.getAttribute("data-date");
    const status = select.value;
    if (status === "asistio") delete student.asistencia[fecha];
    else student.asistencia[fecha] = status;
  });

  try {
    await saveUserData();
    renderStudents(searchBox.value);
    bootstrap.Modal.getInstance(
      document.getElementById("editStudentModal")
    ).hide();
    editingStudentIndex = -1;
    showToast(translate("studentUpdated"), "success");
  } catch (error) {
    handleFirestoreError(error, "saveEditStudent");
  }
};

searchBox.addEventListener("input", () => renderStudents(searchBox.value));

// --- Gestión de Notas ---
document.getElementById("saveNote").onclick = async () => {
  if (!currentSheet) {
    showToast(translate("addNoteSheetWarning"), "warning");
    return;
  }
  const idx = studentSelect.value;
  const notaInput = document.getElementById("noteInput").value;
  if (idx === "") {
    showToast(translate("selectStudent"), "error");
    return;
  }
  if (!SecurityUtils.validateNote(notaInput)) {
    showToast(translate("invalidNote"), "error");
    return;
  }
  students[currentSheet][idx].notas.push(parseFloat(notaInput));
  try {
    await saveUserData();
    renderStudents(searchBox.value);
    bootstrap.Modal.getInstance(document.getElementById("noteModal")).hide();
    document.getElementById("noteInput").value = "";
    showToast(translate("noteAdded"), "success");
  } catch (error) {
    handleFirestoreError(error, "saveNote");
  }
};

function addNoteField(value = "", index = null) {
  const container = document.getElementById("editNotesContainer");
  const noteId = index !== null ? index : Date.now();
  const noteDiv = document.createElement("div");
  noteDiv.className = "input-group mb-2";
  noteDiv.innerHTML = `
    <input type="number" class="form-control note-input" value="${value}" step="0.01" min="0" max="10" placeholder="${translate(
    "notePlaceholder"
  )}" data-index="${noteId}">
    <button class="btn btn-outline-danger" type="button" onclick="removeNoteField(this)"><i class="fas fa-trash"></i></button>`;
  container.appendChild(noteDiv);
}

function removeNoteField(button) {
  button.parentElement.remove();
}

// --- Gestión de Asistencia ---
attendanceBtn.onclick = () => {
  if (!currentSheet) {
    showToast(translate("attendanceSheetWarning"), "warning");
    return;
  }
  const attendanceTableBody = document.querySelector("#attendanceTable tbody");
  attendanceTableBody.innerHTML = "";
  const today = new Date().toISOString().split("T")[0];
  const dateInput = document.getElementById("attendanceDate");
  dateInput.value = today;

  const updateAttendanceRadios = (date) => {
    (students[currentSheet] || []).forEach((student, index) => {
      const status = student.asistencia?.[date] || "asistio";
      const radio = document.querySelector(
        `input[name="attendance-${index}"][value="${status}"]`
      );
      if (radio) radio.checked = true;
    });
  };

  (students[currentSheet] || []).forEach((student, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `<td>${student.nombre}</td>
      <td><input type="radio" name="attendance-${index}" value="asistio" class="attendance-option" data-index="${index}" checked></td>
      <td><input type="radio" name="attendance-${index}" value="falta" class="attendance-option" data-index="${index}"></td>
      <td><input type="radio" name="attendance-${index}" value="retraso" class="attendance-option" data-index="${index}"></td>`;
    attendanceTableBody.appendChild(row);
  });

  updateAttendanceRadios(today);
  showDateWarning(checkExistingAttendance(today));

  dateInput.onchange = () => {
    updateAttendanceRadios(dateInput.value);
    showDateWarning(checkExistingAttendance(dateInput.value));
  };
};

document.getElementById("saveAttendance").onclick = async () => {
  if (!currentSheet) return;
  const fecha = document.getElementById("attendanceDate").value;
  if (!fecha) {
    showToast(translate("selectDate"), "error");
    return;
  }
  if (!SecurityUtils.validateDate(fecha)) {
    showToast(translate("invalidDate"), "error");
    return;
  }
  let hasChanges = false;
  document.querySelectorAll(".attendance-option:checked").forEach((radio) => {
    const index = radio.dataset.index;
    const status = radio.value;
    if (!students[currentSheet][index].asistencia)
      students[currentSheet][index].asistencia = {};
    if (students[currentSheet][index].asistencia[fecha] !== status) {
      students[currentSheet][index].asistencia[fecha] = status;
      hasChanges = true;
    }
  });
  if (hasChanges) {
    try {
      await saveUserData();
      renderStudents(searchBox.value);
      bootstrap.Modal.getInstance(
        document.getElementById("attendanceModal")
      ).hide();
      showToast(translate("attendanceSaved"), "success");
    } catch (error) {
      handleFirestoreError(error, "saveAttendance");
    }
  } else {
    bootstrap.Modal.getInstance(
      document.getElementById("attendanceModal")
    ).hide();
    showToast(translate("noAttendanceChanges"), "info");
  }
};

function addAttendanceField(fecha, status = "asistio") {
  const container = document.getElementById("editAttendanceContainer");
  const attendanceDiv = document.createElement("div");
  attendanceDiv.className = "row mb-2 align-items-center";
  attendanceDiv.innerHTML = `
    <div class="col-md-4"><label class="form-label">${fecha}</label></div>
    <div class="col-md-6">
      <select class="form-select attendance-status" data-date="${fecha}">
        <option value="asistio" ${
          status === "asistio" ? "selected" : ""
        }>${translate("attendedOption")}</option>
        <option value="falta" ${
          status === "falta" ? "selected" : ""
        }>${translate("absentOption")}</option>
        <option value="falta-justificada" ${
          status === "falta-justificada" ? "selected" : ""
        }>${translate("justifiedAbsentOption")}</option>
        <option value="retraso" ${
          status === "retraso" ? "selected" : ""
        }>${translate("tardyOption")}</option>
      </select>
    </div>
    <div class="col-md-2"><button class="btn btn-outline-danger btn-sm" type="button" onclick="removeAttendanceField('${fecha}')"><i class="fas fa-trash"></i></button></div>`;
  container.appendChild(attendanceDiv);
}

function removeAttendanceField(fecha) {
  const student = students[currentSheet][editingStudentIndex];
  if (student.asistencia?.[fecha]) {
    delete student.asistencia[fecha];
  }
  editStudent(editingStudentIndex);
}

function checkExistingAttendance(date) {
  return calculateClassDays().includes(date);
}

// --- Ordenación de la Tabla ---
function initSorting() {
  document
    .querySelectorAll("#studentsTable thead th[data-col]")
    .forEach((header) => {
      header.style.cursor = "pointer";
      const newHeader = header.cloneNode(true);
      header.parentNode.replaceChild(newHeader, header);
      newHeader.addEventListener("click", (e) =>
        handleSort(e.currentTarget.getAttribute("data-col"))
      );
    });
  applySorting();
  updateSortUI();
}

function handleSort(column) {
  sortState.direction =
    sortState.column === column && sortState.direction === "asc"
      ? "desc"
      : "asc";
  sortState.column = column;
  applySorting();
  updateSortUI();
  renderStudents(searchBox.value);
}

function applySorting() {
  if (!currentSheet || !students[currentSheet]) return;
  students[currentSheet].sort((a, b) => {
    let valueA, valueB;
    switch (sortState.column) {
      case "nombre":
        valueA = a.nombre.toLowerCase();
        valueB = b.nombre.toLowerCase();
        break;
      case "notas":
        valueA = a.notas.length;
        valueB = b.notas.length;
        break;
      case "media":
        valueA =
          a.notas.length > 0
            ? a.notas.reduce((s, n) => s + n, 0) / a.notas.length
            : -1;
        valueB =
          b.notas.length > 0
            ? b.notas.reduce((s, n) => s + n, 0) / b.notas.length
            : -1;
        break;
      case "faltas":
        valueA = countFaltas(a);
        valueB = countFaltas(b);
        break;
      case "retrasos":
        valueA = countRetrasos(a);
        valueB = countRetrasos(b);
        break;
      case "porcentaje":
        valueA = calculatePorcentajeFaltas(a);
        valueB = calculatePorcentajeFaltas(b);
        break;
      default:
        return 0;
    }
    if (sortState.direction === "asc") return valueA > valueB ? 1 : -1;
    return valueA < valueB ? 1 : -1;
  });
}

function countFaltas(student) {
  return Object.values(student.asistencia || {}).filter((a) => a === "falta")
    .length;
}

function countRetrasos(student) {
  return Object.values(student.asistencia || {}).filter((a) => a === "retraso")
    .length;
}

function calculatePorcentajeFaltas(student) {
  const totalDias = calculateClassDays().length;
  return totalDias > 0 ? (countFaltas(student) / totalDias) * 100 : 0;
}

function calculateClassDays() {
  const allDates = new Set();
  if (currentSheet && students[currentSheet]) {
    students[currentSheet].forEach((st) =>
      Object.keys(st.asistencia || {}).forEach((date) => allDates.add(date))
    );
  }
  return Array.from(allDates).sort();
}

// --- Gráfico de Notas ---
function showStudentNotesChart(studentIndex) {
  if (!currentSheet) return;
  const student = students[currentSheet][studentIndex];
  if (!student.notas || student.notas.length === 0) {
    showToast(translate("noNotesForChart"), "info");
    return;
  }
  document.getElementById("chartModalTitle").textContent = translate(
    "chartTitle",
    student.nombre
  );
  const average =
    student.notas.reduce((a, b) => a + b, 0) / student.notas.length;
  document.getElementById("chartAverage").textContent = average.toFixed(2);
  document.getElementById("chartTotalNotes").textContent = student.notas.length;
  document.getElementById("chartTrend").textContent = calculateTrend(
    student.notas
  );
  renderNotesChart(student.notas);
  new bootstrap.Modal(document.getElementById("notesChartModal")).show();
}

function calculateTrend(notes) {
  if (notes.length < 2) return translate("chartTrendInsufficient");
  const firstHalf = notes.slice(0, Math.ceil(notes.length / 2));
  const secondHalf = notes.slice(Math.ceil(notes.length / 2));
  const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  const difference = avgSecond - avgFirst;
  if (difference > 0.5) return translate("chartTrendImproving");
  if (difference < -0.5) return translate("chartTrendWorsening");
  return translate("chartTrendStable");
}

function calculateTrendLine(data) {
  if (data.length < 2) return [];
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  return x.map((xi) => slope * xi + intercept);
}

document
  .getElementById("notesChartModal")
  .addEventListener("hidden.bs.modal", () => {
    if (notesChart) {
      notesChart.destroy();
      notesChart = null;
    }
  });

/* ==========================================================================
   6. RENDERIZADO Y MANIPULACIÓN DEL DOM
   ========================================================================== */

function renderStudents(filter = "") {
  try {
    tableBody.innerHTML = "";
    if (!currentSheet) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-5"><div class="empty-state">
        <div><h3 class="text-muted">${translate(
          "noSheetSelected"
        )}</h3><p class="text-muted">${translate("noSheetSelectedBody")}</p>
        <button class="btn btn-primary" onclick="document.getElementById('newSheet').click()"><i class="fas fa-plus"></i> ${translate(
          "createFirstSheet"
        )}</button></div>
      </div></td></tr>`;
    } else if (!students[currentSheet] || students[currentSheet].length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" class="text-center py-5"><div class="empty-state">
        <div><h3 class="text-muted">${translate(
          "noStudents"
        )}</h3><p class="text-muted">${translate("noStudentsBody")}</p>
        <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#studentModal"><i class="fas fa-plus"></i> ${translate(
          "addFirstStudent"
        )}</button></div>
      </div></td></tr>`;
    } else {
      students[currentSheet]
        .filter((st) => st.nombre.toLowerCase().includes(filter.toLowerCase()))
        .forEach((st, idx) => {
          const originalIndex = students[currentSheet].indexOf(st);
          let media = "-",
            mediaNum = 0,
            trClass = "";
          if (st.notas.length > 0) {
            mediaNum = st.notas.reduce((a, b) => a + b, 0) / st.notas.length;
            media = mediaNum.toFixed(2);
            if (mediaNum < 5) trClass = "tr-rojo";
            else if (mediaNum < 7) trClass = "tr-amarillo";
            else trClass = "tr-verde";
          }
          const faltas = countFaltas(st);
          const faltasJustificadas = Object.values(st.asistencia || {}).filter(
            (a) => a === "falta-justificada"
          ).length;
          const retrasos = countRetrasos(st);
          const porcentajeFaltas = calculatePorcentajeFaltas(st);
          const notasContent =
            st.notas.length > 0
              ? `<div style="cursor: pointer;" onclick="showStudentNotesChart(${originalIndex})" title="${translate(
                  "notesChartClickTitle"
                )}"><div class="d-flex align-items-center justify-content-center"><span>${st.notas.join(
                  ", "
                )}</span><i class="fas fa-chart-line text-primary ms-2"></i></div></div>`
              : translate("noNotes");
          const tr = document.createElement("tr");
          if (trClass) tr.className = trClass;
          tr.innerHTML = `
            <td>${
              st.nombre
            }</td><td>${notasContent}</td><td><strong>${media}</strong></td>
            <td>${faltas} ${
            faltasJustificadas > 0
              ? translate("justifiedAbsences", faltasJustificadas)
              : ""
          }</td><td>${retrasos}</td>
            <td><span class="badge ${
              porcentajeFaltas > 20 ? "bg-danger" : "bg-warning"
            }">${porcentajeFaltas.toFixed(1)}%</span></td>
            <td>
              <button class="btn btn-sm btn-primary me-1" onclick="editStudent(${originalIndex})" title="${translate(
            "editButtonTitle"
          )}"><i class="fas fa-edit"></i></button>
              <button class="btn btn-sm btn-danger" onclick="deleteStudent(${originalIndex})" title="${translate(
            "deleteButtonTitle"
          )}"><i class="fas fa-trash"></i></button>
            </td>`;
          tableBody.appendChild(tr);
        });
    }
    // Actualizar estadísticas y selects después de renderizar
    const totalDias = calculateClassDays().length;
    const alumnos = students[currentSheet] || [];
    const alumnosConNotas = alumnos.filter((st) => st.notas.length > 0);
    const mediaGlobal =
      alumnosConNotas.length > 0
        ? alumnosConNotas.reduce(
            (sum, st) =>
              sum + st.notas.reduce((a, b) => a + b, 0) / st.notas.length,
            0
          ) / alumnosConNotas.length
        : 0;
    const totalFaltas = alumnos.reduce((sum, st) => sum + countFaltas(st), 0);
    const porcentajeGlobal =
      totalDias > 0 && alumnos.length > 0
        ? (totalFaltas / (alumnos.length * totalDias)) * 100
        : 0;
    globalAvgEl.textContent = mediaGlobal.toFixed(2);
    globalAbsenceEl.textContent = `${porcentajeGlobal.toFixed(1)}%`;
    totalClassDaysEl.textContent = totalDias;
    updateStudentSelect();
    updateButtonsState();
  } catch (error) {
    console.error("Error al renderizar estudiantes:", error);
    showToast(translate("renderError"), "error");
    tableBody.innerHTML = `<tr><td colspan="7">${translate(
      "renderErrorBody"
    )}</td></tr>`;
  }
}

function renderSheets() {
  sheetsTabs.innerHTML = "";
  sheets.forEach((sheet) => {
    const li = document.createElement("li");
    li.className = "nav-item";
    const deleteBtn =
      sheet === currentSheet
        ? `<span class="sheet-delete ms-2" onclick="event.stopPropagation(); deleteSheet('${sheet}')">✖</span>`
        : "";
    li.innerHTML = `<button class="nav-link ${
      sheet === currentSheet ? "active" : ""
    }" onclick="changeSheet('${sheet}')">${sheet}${deleteBtn}</button>`;
    sheetsTabs.appendChild(li);
  });
}

function updateStudentSelect() {
  studentSelect.innerHTML = `<option value="" disabled selected>${translate(
    "selectStudent"
  )}</option>`;
  if (currentSheet && students[currentSheet]) {
    students[currentSheet].forEach((st, idx) => {
      studentSelect.innerHTML += `<option value="${idx}">${st.nombre}</option>`;
    });
  }
}

function updateButtonsState() {
  const hasSheet = !!currentSheet;
  actionButtons.forEach((btn) => {
    if (btn) {
      btn.disabled = !hasSheet;
      btn.setAttribute("data-bs-toggle", hasSheet ? "modal" : "");
    }
  });
}

function updateSortUI() {
  document
    .querySelectorAll("#studentsTable thead th[data-col]")
    .forEach((header) => {
      header.classList.remove("sort-asc", "sort-desc");
    });
  const currentHeader = document.querySelector(
    `#studentsTable thead th[data-col="${sortState.column}"]`
  );
  if (currentHeader) currentHeader.classList.add(`sort-${sortState.direction}`);
}

function showDateWarning(show) {
  let warningElement = document.getElementById("dateWarning");
  if (!warningElement) {
    warningElement = document.createElement("div");
    warningElement.id = "dateWarning";
    warningElement.className = "alert alert-warning mt-2";
    document
      .getElementById("attendanceDate")
      .parentNode.appendChild(warningElement);
  }
  warningElement.innerHTML = show
    ? `<i class="fas fa-exclamation-triangle"></i> ${translate(
        "attendanceDateWarning"
      )}`
    : "";
  warningElement.classList.toggle("d-none", !show);
}

function renderNotesChart(notes) {
  const ctx = document.getElementById("notesChart").getContext("2d");
  if (notesChart) notesChart.destroy();
  notesChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: notes.map((_, i) => `${translate("chartLabelNote")} ${i + 1}`),
      datasets: [
        {
          label: translate("tableHeaderNotes"),
          data: notes,
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.1)",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: "#007bff",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8,
        },
        {
          label: translate("chartLabelTrend"),
          data: calculateTrendLine(notes),
          borderColor: "#dc3545",
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, max: 10, ticks: { stepSize: 1 } },
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${translate("chartLabelNote")}: ${ctx.parsed.y.toFixed(2)}`,
          },
        },
      },
    },
  });
}

/* ==========================================================================
   7. UTILIDADES
   ========================================================================== */

// --- Internacionalización (i18n) ---
let currentLang = localStorage.getItem("language") || "es";
const translations = {
  es: {
    hello: "Hola",
    loading: "Cargando...",
    processing: "Procesando...",
    confirm: "Confirmación",
    accept: "Aceptar",
    errorOccurred: "Algo salió mal",
    retry: "Reintentar",
    close: "Cerrar",
    loginSuccess: "Inicio de sesión exitoso",
    googleLoginSuccess: "Inicio de sesión con Google exitoso",
    accountCreated: "Cuenta creada exitosamente",
    passwordsMismatch: "Las contraseñas no coinciden",
    passwordRequirements:
      "La contraseña debe tener al menos 6 caracteres, incluyendo letras y números",
    invalidEmail: "Por favor, introduce un email válido",
    "auth/user-not-found": "Usuario no encontrado",
    "auth/wrong-password": "Contraseña incorrecta",
    "auth/email-already-in-use": "El correo ya está en uso",
    "auth/weak-password": "La contraseña es demasiado débil",
    "auth/invalid-email": "Correo electrónico inválido",
    loadingData: "Cargando tus datos...",
    inconsistentData: "Se detectaron datos inconsistentes. Reinicializando...",
    loadError: "Error al cargar los datos. Intenta recargar la página.",
    syncingData: "Sincronizando datos...",
    permissionError: "Error de permisos. Verifica tu conexión.",
    offlineError: "Sin conexión. Los cambios se guardarán localmente.",
    confirmDeleteSheet: (name) =>
      `¿Estás seguro de eliminar la hoja "${name}" y todos sus datos?`,
    sheetDeleted: "Hoja eliminada correctamente",
    sheetDeleteError: "Error al eliminar la hoja",
    newSheetModalTitle: "Nueva Hoja",
    newSheetPlaceholder: "Nombre de la nueva hoja",
    sheetNameEmpty: "El nombre no puede estar vacío",
    sheetNameExists: "Ya existe una hoja con ese nombre",
    sheetCreated: "Hoja creada correctamente",
    sheetCreateError: "Error al crear la hoja",
    noSheetSelected: "No hay hoja seleccionada",
    noSheetSelectedBody: "Crea una nueva hoja para comenzar",
    createFirstSheet: "Crear Primera Hoja",
    noStudents: "No hay estudiantes",
    noStudentsBody: "Añade estudiantes a esta hoja",
    addFirstStudent: "Añadir Primer Estudiante",
    studentSavedLocally: "Guardado localmente (sin conexión)",
    studentSaveError: (msg) => `Error al guardar: ${msg}`,
    confirmDeleteStudent: (name) =>
      `¿Estás seguro de eliminar al estudiante "${name}"?`,
    studentDeleted: "Estudiante eliminado correctamente",
    studentDeleteError: "Error al eliminar el estudiante",
    studentUpdated: "Estudiante actualizado correctamente",
    studentUpdateError: "Error al guardar los cambios",
    addStudentSheetWarning:
      "Debes crear o seleccionar una hoja antes de añadir estudiantes.",
    studentNameEmpty: "El nombre no puede estar vacío",
    studentNameDuplicate: "Ya existe un estudiante con ese nombre",
    studentAdded: "Estudiante añadido correctamente",
    addNoteSheetWarning:
      "Debes crear o seleccionar una hoja antes de añadir notas.",
    selectStudent: "Selecciona un estudiante",
    invalidNote: "La nota debe ser un número entre 0 y 10",
    noteAdded: "Nota añadida correctamente",
    noteSaveError: "Error al guardar la nota",
    invalidNotesIgnored: "Algunas notas no eran válidas y fueron ignoradas",
    noNotesForChart: "Este estudiante no tiene notas para mostrar",
    attendanceSheetWarning:
      "Debes crear o seleccionar una hoja antes de registrar asistencia.",
    attendanceDateWarning:
      "Ya existe asistencia registrada para esta fecha. Al guardar, se actualizarán los registros existentes.",
    selectDate: "Por favor, selecciona una fecha.",
    invalidDate: "La fecha seleccionada no es válida",
    attendanceSaved: "Asistencia guardada correctamente",
    attendanceSaveError: "Error al guardar la asistencia",
    noAttendanceChanges: "No se realizaron cambios en la asistencia",
    chartTitle: (name) => `Evolución de Notas - ${name}`,
    chartTrendInsufficient: "Insuficientes datos",
    chartTrendImproving: "📈 Mejorando",
    chartTrendWorsening: "📉 Bajando",
    chartTrendStable: "➡️ Estable",
    chartLabelNote: "Nota",
    chartLabelTrend: "Tendencia",
    noNotes: "Sin notas",
    justifiedAbsences: (count) => `(${count} just.)`,
    renderError: "Error al mostrar los estudiantes",
    renderErrorBody: "Error cargando datos",
    appTitle: "GradeSync",
    appTitleHeader: "GradeSync",
    loginSubtitle: "Inicia sesión en tu cuenta",
    emailLabel: "Correo electrónico",
    passwordLabel: "Contraseña",
    loginButton: "Iniciar Sesión",
    createAccountButton: "Crear Nueva Cuenta",
    googleLoginButton: "Continuar con Google",
    createAccountTitle: "Crear Nueva Cuenta",
    fullNameLabel: "Nombre completo",
    confirmPasswordLabel: "Confirmar contraseña",
    backToLoginButton: "Volver al inicio de sesión",
    themeButton: "Tema",
    logoutButton: "Salir",
    addStudentButton: "Añadir Estudiante",
    addNoteButton: "Añadir Nota",
    attendanceButton: "Asistencia",
    newSheetButton: "Nueva Hoja",
    tableHeaderName: "Nombre",
    tableHeaderNotes: "Notas",
    tableHeaderAverage: "Media",
    tableHeaderAbsences: "Faltas",
    tableHeaderTardies: "Retrasos",
    tableHeaderAbsencePercentage: "% Faltas",
    tableHeaderActions: "Acciones",
    statsGlobalAverage: "Media global",
    statsAbsencePercentage: "Porcentaje de faltas",
    statsTotalClassDays: "Total días de clase",
    footerText: "© 2025 Pablo Almellones Ramos | Todos los derechos reservados",
    modalAddStudentTitle: "Añadir Estudiante",
    cancelButton: "Cancelar",
    saveButton: "Guardar",
    modalAddNoteTitle: "Añadir Nota",
    modalAttendanceTitle: "Registrar Asistencia",
    classDateLabel: "Fecha de la clase",
    studentHeader: "Alumno",
    attendedHeader: "Asistió",
    absentHeader: "Falta",
    tardyHeader: "Retraso",
    saveAttendanceButton: "Guardar Asistencia",
    modalEditStudentTitle: "Editar Estudiante",
    notesLabel: "Notas",
    attendanceByDateLabel: "Asistencia por fecha",
    saveChangesButton: "Guardar Cambios",
    modalChartTitle: "Evolución de Notas",
    chartAverageNote: "Nota Media:",
    chartTotalNotes: "Total Notas:",
    chartTrend: "Tendencia:",
    closeButton: "Cerrar",
    attendedOption: "Asistió",
    absentOption: "Falta",
    justifiedAbsentOption: "Falta Justificada",
    tardyOption: "Retraso",
    emailPlaceholder: "usuario@ejemplo.com",
    passwordPlaceholder: "••••••••",
    fullNamePlaceholder: "Tu nombre completo",
    passwordMinLengthPlaceholder: "Mínimo 6 caracteres",
    confirmPasswordPlaceholder: "Repite tu contraseña",
    searchPlaceholder: "🔍 Buscar estudiante...",
    notePlaceholder: "Nota (0-10)",
    editButtonTitle: "Editar",
    deleteButtonTitle: "Eliminar",
    notesChartClickTitle: "Haz clic para ver gráfico de notas",
  },
  en: {
    hello: "Hello",
    loading: "Loading...",
    processing: "Processing...",
    confirm: "Confirmation",
    accept: "Accept",
    errorOccurred: "Something went wrong",
    retry: "Retry",
    close: "Close",
    loginSuccess: "Login successful",
    googleLoginSuccess: "Login with Google successful",
    accountCreated: "Account created successfully",
    passwordsMismatch: "Passwords do not match",
    passwordRequirements:
      "Password must be at least 6 characters long, including letters and numbers",
    invalidEmail: "Please enter a valid email",
    "auth/user-not-found": "User not found",
    "auth/wrong-password": "Incorrect password",
    "auth/email-already-in-use": "The email is already in use",
    "auth/weak-password": "The password is too weak",
    "auth/invalid-email": "Invalid email",
    loadingData: "Loading your data...",
    inconsistentData: "Inconsistent data detected. Reinitializing...",
    loadError: "Error loading data. Please try reloading the page.",
    syncingData: "Syncing data...",
    permissionError: "Permission error. Check your connection.",
    offlineError: "No connection. Changes will be saved locally.",
    confirmDeleteSheet: (name) =>
      `Are you sure you want to delete the sheet "${name}" and all its data?`,
    sheetDeleted: "Sheet deleted successfully",
    sheetDeleteError: "Error deleting sheet",
    newSheetModalTitle: "New Sheet",
    newSheetPlaceholder: "Name of the new sheet",
    sheetNameEmpty: "The name cannot be empty",
    sheetNameExists: "A sheet with that name already exists",
    sheetCreated: "Sheet created successfully",
    sheetCreateError: "Error creating sheet",
    noSheetSelected: "No sheet selected",
    noSheetSelectedBody: "Create a new sheet to get started",
    createFirstSheet: "Create First Sheet",
    noStudents: "No students",
    noStudentsBody: "Add students to this sheet",
    addFirstStudent: "Add First Student",
    studentSavedLocally: "Saved locally (offline)",
    studentSaveError: (msg) => `Error saving: ${msg}`,
    confirmDeleteStudent: (name) =>
      `Are you sure you want to delete the student "${name}"?`,
    studentDeleted: "Student deleted successfully",
    studentDeleteError: "Error deleting student",
    studentUpdated: "Student updated successfully",
    studentUpdateError: "Error saving changes",
    addStudentSheetWarning:
      "You must create or select a sheet before adding students.",
    studentNameEmpty: "The name cannot be empty",
    studentNameDuplicate: "A student with that name already exists",
    studentAdded: "Student added successfully",
    addNoteSheetWarning:
      "You must create or select a sheet before adding notes.",
    selectStudent: "Select a student",
    invalidNote: "The grade must be a number between 0 and 10",
    noteAdded: "Grade added successfully",
    noteSaveError: "Error saving the grade",
    invalidNotesIgnored: "Some invalid grades were ignored",
    noNotesForChart: "This student has no grades to display",
    attendanceSheetWarning:
      "You must create or select a sheet before recording attendance.",
    attendanceDateWarning:
      "Attendance already exists for this date. Saving will update the existing records.",
    selectDate: "Please select a date.",
    invalidDate: "The selected date is not valid",
    attendanceSaved: "Attendance saved successfully",
    attendanceSaveError: "Error saving attendance",
    noAttendanceChanges: "No changes were made to the attendance",
    chartTitle: (name) => `Grade Evolution - ${name}`,
    chartTrendInsufficient: "Insufficient data",
    chartTrendImproving: "📈 Improving",
    chartTrendWorsening: "📉 Worsening",
    chartTrendStable: "➡️ Stable",
    chartLabelNote: "Grade",
    chartLabelTrend: "Trend",
    noNotes: "No grades",
    justifiedAbsences: (count) => `(${count} just.)`,
    renderError: "Error displaying students",
    renderErrorBody: "Error loading data",
    appTitle: "GradeSync",
    appTitleHeader: "GradeSync",
    loginSubtitle: "Log in to your account",
    emailLabel: "Email address",
    passwordLabel: "Password",
    loginButton: "Log In",
    createAccountButton: "Create New Account",
    googleLoginButton: "Continue with Google",
    createAccountTitle: "Create New Account",
    fullNameLabel: "Full name",
    confirmPasswordLabel: "Confirm password",
    backToLoginButton: "Back to login",
    themeButton: "Theme",
    logoutButton: "Logout",
    addStudentButton: "Add Student",
    addNoteButton: "Add Grade",
    attendanceButton: "Attendance",
    newSheetButton: "New Sheet",
    tableHeaderName: "Name",
    tableHeaderNotes: "Grades",
    tableHeaderAverage: "Average",
    tableHeaderAbsences: "Absences",
    tableHeaderTardies: "Tardies",
    tableHeaderAbsencePercentage: "% Absences",
    tableHeaderActions: "Actions",
    statsGlobalAverage: "Global average",
    statsAbsencePercentage: "Absence percentage",
    statsTotalClassDays: "Total class days",
    footerText: "© 2025 Pablo Almellones Ramos | All rights reserved",
    modalAddStudentTitle: "Add Student",
    cancelButton: "Cancel",
    saveButton: "Save",
    modalAddNoteTitle: "Add Grade",
    modalAttendanceTitle: "Record Attendance",
    classDateLabel: "Class date",
    studentHeader: "Student",
    attendedHeader: "Attended",
    absentHeader: "Absent",
    tardyHeader: "Tardy",
    saveAttendanceButton: "Save Attendance",
    modalEditStudentTitle: "Edit Student",
    notesLabel: "Grades",
    attendanceByDateLabel: "Attendance by date",
    saveChangesButton: "Save Changes",
    modalChartTitle: "Grade Evolution",
    chartAverageNote: "Average Grade:",
    chartTotalNotes: "Total Grades:",
    chartTrend: "Trend:",
    closeButton: "Close",
    attendedOption: "Attended",
    absentOption: "Absent",
    justifiedAbsentOption: "Justified Absent",
    tardyOption: "Tardy",
    emailPlaceholder: "user@example.com",
    passwordPlaceholder: "••••••••",
    fullNamePlaceholder: "Your full name",
    passwordMinLengthPlaceholder: "At least 6 characters",
    confirmPasswordPlaceholder: "Repeat your password",
    searchPlaceholder: "🔍 Search for student...",
    notePlaceholder: "Grade (0-10)",
    editButtonTitle: "Edit",
    deleteButtonTitle: "Delete",
    notesChartClickTitle: "Click to see grade chart",
  },
};
function translate(key, ...args) {
  const text = translations[currentLang][key];
  return typeof text === "function" ? text(...args) : text || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;
  document.querySelectorAll("[data-lang]").forEach((el) => {
    const key = el.getAttribute("data-lang");
    if (translations[lang][key]) el.textContent = translations[lang][key];
  });
  document.querySelectorAll("[data-lang-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-lang-placeholder");
    if (translations[lang][key]) el.placeholder = translations[lang][key];
  });
  document.querySelectorAll("[data-lang-title]").forEach((el) => {
    const key = el.getAttribute("data-lang-title");
    if (translations[lang][key]) el.title = translations[lang][key];
  });
  if (currentUser) {
    renderStudents(searchBox.value);
    updateStudentSelect();
  }
}

// --- Utilidades de Seguridad ---
const SecurityUtils = {
  sanitizeString: (str) =>
    typeof str === "string" ? str.trim().replace(/[<>'"&]/g, "") : "",
  validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  sanitizeStudentName: (name) =>
    typeof name === "string"
      ? name
          .trim()
          .replace(/[<>'"&\\/]/g, "")
          .replace(/\s+/g, " ")
          .substring(0, 100)
      : "",
  validatePassword: (password) =>
    /^(?=.*[A-Za-z])(?=.*\d).{6,}$/.test(password),
  validateNote: (note) =>
    !isNaN(parseFloat(note)) && isFinite(note) && note >= 0 && note <= 10,
  validateDate: (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date) && date <= new Date();
  },
};

// --- Validación de Datos ---
const DataValidation = {
  validateStudent: (st) =>
    st &&
    typeof st.nombre === "string" &&
    st.nombre.trim() &&
    Array.isArray(st.notas) &&
    st.notas.every((n) => typeof n === "number" && n >= 0 && n <= 10) &&
    typeof st.asistencia === "object",
  validateStudentsStructure: (data) =>
    data &&
    typeof data === "object" &&
    Object.values(data).every(
      (arr) => Array.isArray(arr) && arr.every(DataValidation.validateStudent)
    ),
  validateUserData: (data) =>
    data &&
    DataValidation.validateStudentsStructure(data.students) &&
    Array.isArray(data.sheets) &&
    Array.isArray(data.classDays) &&
    typeof data.userEmail === "string",
};

// --- Componentes de UI (Modales, Toasts, Overlays) ---
document.addEventListener("hide.bs.modal", () => {
  if (document.activeElement) document.activeElement.blur();
});

function showConfirmation(message, onConfirm, onCancel = null) {
  let modalEl = document.getElementById("confirmationModal");
  if (!modalEl) {
    modalEl = document.createElement("div");
    modalEl.id = "confirmationModal";
    modalEl.className = "modal fade";
    modalEl.innerHTML = `<div class="modal-dialog modal-dialog-centered"><div class="modal-content">
      <div class="modal-header"><h5 class="modal-title">${translate(
        "confirm"
      )}</h5><button type="button" class="btn-close" data-bs-dismiss="modal"></button></div>
      <div class="modal-body"><p id="confirmationMessage"></p></div>
      <div class="modal-footer"><button type="button" class="btn btn-secondary" id="confirmCancelBtn">${translate(
        "cancelButton"
      )}</button><button type="button" class="btn btn-danger" id="confirmOkBtn">${translate(
      "accept"
    )}</button></div>
    </div></div>`;
    document.body.appendChild(modalEl);
  }
  document.getElementById("confirmationMessage").textContent = message;
  const modal = new bootstrap.Modal(modalEl);
  const okBtn = document.getElementById("confirmOkBtn");
  const cancelBtn = document.getElementById("confirmCancelBtn");
  const cleanup = () => {
    okBtn.onclick = null;
    cancelBtn.onclick = null;
    modal.hide();
  };
  okBtn.onclick = () => {
    cleanup();
    onConfirm();
  };
  cancelBtn.onclick = () => {
    cleanup();
    if (onCancel) onCancel();
  };
  modal.show();
}

function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    document.body.appendChild(container);
  }
  const toastId = "toast-" + Date.now();
  const toast = document.createElement("div");
  toast.id = toastId;
  const icons = {
    success: "fa-check-circle",
    error: "fa-exclamation-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  };
  toast.className = `alert alert-${type} alert-dismissible fade show`;
  toast.innerHTML = `<i class="fas ${icons[type]} me-2"></i>${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>`;
  container.appendChild(toast);
  setTimeout(() => document.getElementById(toastId)?.remove(), 5000);
}

const ErrorStates = {
  showErrorState: (message, showRetry = true) => {
    let container = document.getElementById("error-state-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "error-state-container";
      container.className = "error-container";
      document.body.appendChild(container);
    }
    const retryBtn = showRetry
      ? `<button class="btn btn-primary" onclick="location.reload()"><i class="fas fa-redo"></i> ${translate(
          "retry"
        )}</button>`
      : "";
    container.innerHTML = `<div class="error-state text-center py-5">
      <div class="error-icon mb-3" style="font-size: 4rem;">😕</div><h3>${translate(
        "errorOccurred"
      )}</h3><p class="text-muted">${message}</p>${retryBtn}
    </div>`;
    container.style.display = "block";
    appContainer.classList.add("d-none");
  },
  showLoadingState: (message = translate("loading")) => {
    let container = document.getElementById("loading-state-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "loading-state-container";
      container.className = "loading-container";
      document.body.appendChild(container);
    }
    container.innerHTML = `<div class="loading-state text-center py-5">
      <div class="spinner-border text-primary" role="status"></div><p class="text-muted mt-2">${message}</p>
    </div>`;
    container.style.display = "block";
  },
  hideLoadingState: () => {
    const container = document.getElementById("loading-state-container");
    if (container) container.style.display = "none";
  },
};

// --- Event Listeners Globales ---
document.getElementById("themeToggle").onclick = () =>
  document.body.classList.toggle("dark-theme");
document.getElementById("langToggle").onclick = () =>
  setLanguage(currentLang === "es" ? "en" : "es");
