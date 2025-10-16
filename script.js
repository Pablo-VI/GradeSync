// ===== VARIABLES GLOBALES =====
let students = {};
let sheets = [];
let currentSheet = "";
let classDays = [];
let editingStudentIndex = -1;
let currentUser = null;
let sortState = {
  column: "nombre",
  direction: "asc", // 'asc' o 'desc'
};

// ===== GESTOR DE ERRORES GLOBAL =====
window.addEventListener("error", function (event) {
  ErrorStates.showErrorState(
    "Ha ocurrido un error inesperado en la aplicación."
  );
});

window.addEventListener("unhandledrejection", function (event) {
  ErrorStates.showErrorState(
    "Ha ocurrido un error inesperado en una operación asíncrona."
  );
});

// ===== MANEJAR ERRORES DE GUARDADO =====
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

// ===== I18N - INTERNACIONALIZACIÓN =====
let currentLang = localStorage.getItem("language") || "es";

const translations = {
  es: {
    // General
    hello: "Hola",
    loading: "Cargando...",
    processing: "Procesando...",
    confirm: "Confirmación",
    accept: "Aceptar",
    errorOccurred: "Algo salió mal",
    retry: "Reintentar",
    close: "Cerrar",
    // Auth
    loginSuccess: "Inicio de sesión exitoso",
    googleLoginSuccess: "Inicio de sesión con Google exitoso",
    accountCreated: "Cuenta creada exitosamente",
    passwordsMismatch: "Las contraseñas no coinciden",
    passwordRequirements:
      "La contraseña debe tener al menos 6 caracteres, incluyendo letras y números",
    invalidEmail: "Por favor, introduce un email válido",
    // Auth Firebase Errors
    "auth/user-not-found": "Usuario no encontrado",
    "auth/wrong-password": "Contraseña incorrecta",
    "auth/email-already-in-use": "El correo ya está en uso",
    "auth/weak-password": "La contraseña es demasiado débil",
    "auth/invalid-email": "Correo electrónico inválido",
    // App
    loadingData: "Cargando tus datos...",
    inconsistentData: "Se detectaron datos inconsistentes. Reinicializando...",
    loadError: "Error al cargar los datos. Intenta recargar la página.",
    syncingData: "Sincronizando datos...",
    permissionError: "Error de permisos. Verifica tu conexión.",
    offlineError: "Sin conexión. Los cambios se guardarán localmente.",
    // Sheets
    confirmDeleteSheet: (sheetName) =>
      `¿Estás seguro de eliminar la hoja "${sheetName}" y todos sus datos?`,
    sheetDeleted: "Hoja eliminada correctamente",
    sheetDeleteError: "Error al eliminar la hoja",
    newSheetModalTitle: "Nueva Hoja",
    newSheetPlaceholder: "Nombre de la nueva hoja",
    sheetNameEmpty: "El nombre no puede estar vacío",
    sheetNameExists: "Ya existe una hoja con ese nombre",
    sheetCreated: "Hoja creada correctamente",
    sheetCreateError: "Error al crear la hoja",
    // Students
    noSheetSelected: "No hay hoja seleccionada",
    noSheetSelectedBody: "Crea una nueva hoja para comenzar",
    createFirstSheet: "Crear Primera Hoja",
    noStudents: "No hay estudiantes",
    noStudentsBody: "Añade estudiantes a esta hoja",
    addFirstStudent: "Añadir Primer Estudiante",
    studentSavedLocally: "Estudiante guardado localmente (sin conexión)",
    studentSaveError: (message) => `Error al guardar el estudiante: ${message}`,
    confirmDeleteStudent: (studentName) =>
      `¿Estás seguro de eliminar al estudiante "${studentName}"?`,
    studentDeleted: "Estudiante eliminado correctamente",
    studentDeleteError: "Error al eliminar el estudiante",
    studentUpdated: "Estudiante actualizado correctamente",
    studentUpdateError: "Error al guardar los cambios",
    addStudentSheetWarning:
      "Debes crear o seleccionar una hoja antes de añadir estudiantes.",
    studentNameEmpty: "El nombre no puede estar vacío",
    studentNameDuplicate: "Ya existe un estudiante con ese nombre",
    studentAdded: "Estudiante añadido correctamente",
    // Notes
    addNoteSheetWarning:
      "Debes crear o seleccionar una hoja antes de añadir notas.",
    selectStudent: "Selecciona un estudiante",
    invalidNote: "La nota debe ser un número entre 0 y 10",
    noteAdded: "Nota añadida correctamente",
    noteSaveError: "Error al guardar la nota",
    invalidNotesIgnored: "Algunas notas no eran válidas y fueron ignoradas",
    noNotesForChart: "Este estudiante no tiene notas para mostrar",
    // Attendance
    attendanceSheetWarning:
      "Debes crear o seleccionar una hoja antes de registrar asistencia.",
    attendanceDateWarning:
      "Ya existe asistencia registrada para esta fecha. Al guardar, se actualizarán los registros existentes.",
    selectDate: "Por favor, selecciona una fecha.",
    invalidDate: "La fecha seleccionada no es válida",
    attendanceSaved: "Asistencia guardada correctamente",
    attendanceSaveError: "Error al guardar la asistencia",
    noAttendanceChanges: "No se realizaron cambios en la asistencia",
    // Chart
    chartTitle: (studentName) => `Evolución de Notas - ${studentName}`,
    chartTrendInsufficient: "Insuficientes datos",
    chartTrendImproving: "📈 Mejorando",
    chartTrendWorsening: "📉 Bajando",
    chartTrendStable: "➡️ Estable",
    chartLabelNote: "Nota",
    chartLabelTrend: "Tendencia",
    // Table content
    noNotes: "Sin notas",
    justifiedAbsences: (count) => `(${count} just.)`,
    // Render Errors
    renderError: "Error al mostrar los estudiantes",
    renderErrorBody: "Error cargando datos",
    // Misc
    langChangeNotImplemented:
      "Funcionalidad de cambio de idioma por implementar",
    // Static HTML text keys (from data-lang attributes)
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
    statsGlobalAverage: "Media global:",
    statsAbsencePercentage: "Porcentaje de faltas:",
    statsTotalClassDays: "Total días de clase:",
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
    // General
    hello: "Hello",
    loading: "Loading...",
    processing: "Processing...",
    confirm: "Confirmation",
    accept: "Accept",
    errorOccurred: "Something went wrong",
    retry: "Retry",
    close: "Close",
    // Auth
    loginSuccess: "Login successful",
    googleLoginSuccess: "Login with Google successful",
    accountCreated: "Account created successfully",
    passwordsMismatch: "Passwords do not match",
    passwordRequirements:
      "Password must be at least 6 characters long, including letters and numbers",
    invalidEmail: "Please enter a valid email",
    // Auth Firebase Errors
    "auth/user-not-found": "User not found",
    "auth/wrong-password": "Incorrect password",
    "auth/email-already-in-use": "The email is already in use",
    "auth/weak-password": "The password is too weak",
    "auth/invalid-email": "Invalid email",
    // App
    loadingData: "Loading your data...",
    inconsistentData: "Inconsistent data detected. Reinitializing...",
    loadError: "Error loading data. Please try reloading the page.",
    syncingData: "Syncing data...",
    permissionError: "Permission error. Check your connection.",
    offlineError: "No connection. Changes will be saved locally.",
    // Sheets
    confirmDeleteSheet: (sheetName) =>
      `Are you sure you want to delete the sheet "${sheetName}" and all its data?`,
    sheetDeleted: "Sheet deleted successfully",
    sheetDeleteError: "Error deleting sheet",
    newSheetModalTitle: "New Sheet",
    newSheetPlaceholder: "Name of the new sheet",
    sheetNameEmpty: "The name cannot be empty",
    sheetNameExists: "A sheet with that name already exists",
    sheetCreated: "Sheet created successfully",
    sheetCreateError: "Error creating sheet",
    // Students
    noSheetSelected: "No sheet selected",
    noSheetSelectedBody: "Create a new sheet to get started",
    createFirstSheet: "Create First Sheet",
    noStudents: "No students",
    noStudentsBody: "Add students to this sheet",
    addFirstStudent: "Add First Student",
    studentSavedLocally: "Student saved locally (offline)",
    studentSaveError: (message) => `Error saving student: ${message}`,
    confirmDeleteStudent: (studentName) =>
      `Are you sure you want to delete the student "${studentName}"?`,
    studentDeleted: "Student deleted successfully",
    studentDeleteError: "Error deleting student",
    studentUpdated: "Student updated successfully",
    studentUpdateError: "Error saving changes",
    addStudentSheetWarning:
      "You must create or select a sheet before adding students.",
    studentNameEmpty: "The name cannot be empty",
    studentNameDuplicate: "A student with that name already exists",
    studentAdded: "Student added successfully",
    // Notes
    addNoteSheetWarning:
      "You must create or select a sheet before adding notes.",
    selectStudent: "Select a student",
    invalidNote: "The grade must be a number between 0 and 10",
    noteAdded: "Grade added successfully",
    noteSaveError: "Error saving the grade",
    invalidNotesIgnored: "Some invalid grades were ignored",
    noNotesForChart: "This student has no grades to display",
    // Attendance
    attendanceSheetWarning:
      "You must create or select a sheet before recording attendance.",
    attendanceDateWarning:
      "Attendance already exists for this date. Saving will update the existing records.",
    selectDate: "Please select a date.",
    invalidDate: "The selected date is not valid",
    attendanceSaved: "Attendance saved successfully",
    attendanceSaveError: "Error saving attendance",
    noAttendanceChanges: "No changes were made to the attendance",
    // Chart
    chartTitle: (studentName) => `Grade Evolution - ${studentName}`,
    chartTrendInsufficient: "Insufficient data",
    chartTrendImproving: "📈 Improving",
    chartTrendWorsening: "📉 Worsening",
    chartTrendStable: "➡️ Stable",
    chartLabelNote: "Grade",
    chartLabelTrend: "Trend",
    // Table content
    noNotes: "No grades",
    justifiedAbsences: (count) => `(${count} just.)`,
    // Render Errors
    renderError: "Error displaying students",
    renderErrorBody: "Error loading data",
    // Misc
    langChangeNotImplemented: "Language change functionality to be implemented",
    // Static HTML text keys (from data-lang attributes)
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
    statsGlobalAverage: "Global average:",
    statsAbsencePercentage: "Absence percentage:",
    statsTotalClassDays: "Total class days:",
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
  const translation = translations[currentLang][key];
  if (typeof translation === "function") {
    return translation(...args);
  }
  return translation || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem("language", lang);

  document.documentElement.lang = lang;

  // Update static text
  document.querySelectorAll("[data-lang]").forEach((el) => {
    const key = el.getAttribute("data-lang");
    if (translations[lang][key]) {
      el.textContent = translations[lang][key];
    }
  });

  // Update placeholders
  document.querySelectorAll("[data-lang-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-lang-placeholder");
    if (translations[lang][key]) {
      el.placeholder = translations[lang][key];
    }
  });

  // Update titles
  document.querySelectorAll("[data-lang-title]").forEach((el) => {
    const key = el.getAttribute("data-lang-title");
    if (translations[lang][key]) {
      el.title = translations[lang][key];
    }
  });

  // Re-render dynamic content
  if (currentUser) {
    renderStudents(searchBox.value);
    updateStudentSelect();
  }
  /*   console.log(`Language changed to ${lang}`);
   */
}
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
      .replace(/[<>'"&\\/]/g, "")
      .replace(/\s+/g, " ")
      .substring(0, 100);

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

// ===== MEJORA DE ACCESIBILIDAD PARA MODALES =====
document.addEventListener("hide.bs.modal", function () {
  // Si hay un elemento con foco en el documento, se lo quitamos (blur).
  if (document.activeElement) {
    document.activeElement.blur();
  }
});

// ===== SISTEMA DE ORDENACIÓN MEJORADO =====
function initSorting() {
  const headers = document.querySelectorAll(
    "#studentsTable thead th[data-col]"
  );

  headers.forEach((header) => {
    header.style.cursor = "pointer";

    // Remover event listeners existentes para evitar duplicados
    header.replaceWith(header.cloneNode(true));
  });

  // Re-asignar event listeners después del clonado
  document
    .querySelectorAll("#studentsTable thead th[data-col]")
    .forEach((header) => {
      header.addEventListener("click", (e) => {
        const column = e.currentTarget.getAttribute("data-col");
        handleSort(column);
      });
    });

  // Aplicar ordenación inicial
  applySorting();
  updateSortUI();
}

function handleSort(column) {
  // Si es la misma columna, cambiar dirección
  if (sortState.column === column) {
    sortState.direction = sortState.direction === "asc" ? "desc" : "asc";
  } else {
    // Si es columna diferente, orden ascendente por defecto
    sortState.column = column;
    sortState.direction = "asc";
  }

  applySorting();
  updateSortUI();
  renderStudents(searchBox.value);
}

function applySorting() {
  if (!currentSheet || !students[currentSheet]) return;

  const alumnos = students[currentSheet];

  alumnos.sort((a, b) => {
    let valueA, valueB;

    switch (sortState.column) {
      case "nombre":
        valueA = a.nombre.toLowerCase();
        valueB = b.nombre.toLowerCase();
        break;

      case "notas":
        // Ordenar por cantidad de notas
        valueA = a.notas.length;
        valueB = b.notas.length;
        break;

      case "media":
        const mediaA =
          a.notas.length > 0
            ? a.notas.reduce((sum, nota) => sum + nota, 0) / a.notas.length
            : -1;
        const mediaB =
          b.notas.length > 0
            ? b.notas.reduce((sum, nota) => sum + nota, 0) / b.notas.length
            : -1;
        valueA = mediaA;
        valueB = mediaB;
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

    // Manejar valores no definidos o nulos
    if (valueA == null) valueA = -1;
    if (valueB == null) valueB = -1;

    // Comparar según la dirección
    if (sortState.direction === "asc") {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
    }
  });
}

// Funciones auxiliares para cálculos de ordenación
function countFaltas(student) {
  if (!student.asistencia) return 0;
  const asistencia = student.asistencia;
  return Object.values(asistencia).filter((a) => a === "falta").length;
}

function countRetrasos(student) {
  if (!student.asistencia) return 0;
  const asistencia = student.asistencia;
  return Object.values(asistencia).filter((a) => a === "retraso").length;
}

function calculatePorcentajeFaltas(student) {
  const totalDiasClase = calculateClassDays().length;
  const faltas = countFaltas(student);
  return totalDiasClase > 0 ? (faltas / totalDiasClase) * 100 : 0;
}

function updateSortUI() {
  // Remover clases de ordenación existentes
  const headers = document.querySelectorAll(
    "#studentsTable thead th[data-col]"
  );
  headers.forEach((header) => {
    header.classList.remove("sort-asc", "sort-desc");
  });

  // Añadir clase a la columna actualmente ordenada
  const currentHeader = document.querySelector(
    `#studentsTable thead th[data-col="${sortState.column}"]`
  );
  if (currentHeader) {
    currentHeader.classList.add(`sort-${sortState.direction}`);
  }
}

// ===== VALIDACIÓN DE ESQUEMAS DE DATOS =====
const DataValidation = {
  validateStudent: (student) => {
    if (!student || typeof student !== "object") return false;

    return (
      typeof student.nombre === "string" &&
      student.nombre.trim().length > 0 &&
      Array.isArray(student.notas) &&
      student.notas.every(
        (nota) => typeof nota === "number" && nota >= 0 && nota <= 10
      ) &&
      typeof student.asistencia === "object" &&
      student.asistencia !== null
    );
  },

  validateStudentsStructure: (studentsData) => {
    if (!studentsData || typeof studentsData !== "object") return false;

    try {
      // Verificar que todas las hojas tengan arrays válidos
      return Object.values(studentsData).every(
        (sheetStudents) =>
          Array.isArray(sheetStudents) &&
          sheetStudents.every((student) =>
            DataValidation.validateStudent(student)
          )
      );
    } catch (error) {
      console.error("Error validando estructura de estudiantes:", error);
      return false;
    }
  },

  validateUserData: (userData) => {
    if (!userData || typeof userData !== "object") return false;

    return (
      DataValidation.validateStudentsStructure(userData.students) &&
      Array.isArray(userData.sheets) &&
      Array.isArray(userData.classDays) &&
      typeof userData.userEmail === "string"
    );
  },
};
// ===== MANEJO DE ESTADOS DE ERROR EN UI =====
const ErrorStates = {
  showErrorState: (message, showRetry = true) => {
    const errorHtml = `
      <div class="error-state text-center py-5">
        <div class="error-icon mb-3" style="font-size: 4rem;">😕</div>
        <h3 class="text-danger mb-3">${translate("errorOccurred")}</h3>
        <p class="text-muted mb-4">${message}</p>
        ${
          showRetry
            ? `
          <button class="btn btn-primary me-2" onclick="location.reload()">
            <i class="fas fa-redo"></i> ${translate("retry")}
          </button>
        `
            : ""
        }
        <button class="btn btn-outline-secondary" onclick="ErrorStates.hideErrorState()">
          <i class="fas fa-times"></i> ${translate("close")}
        </button>
      </div>
    `;

    // Crear o actualizar contenedor de error
    let errorContainer = document.getElementById("error-state-container");
    if (!errorContainer) {
      errorContainer = document.createElement("div");
      errorContainer.id = "error-state-container";
      errorContainer.className = "error-container";
      document.body.appendChild(errorContainer);
    }

    errorContainer.innerHTML = errorHtml;
    errorContainer.style.display = "block";

    // Ocultar la aplicación principal
    appContainer.classList.add("d-none");
  },

  hideErrorState: () => {
    const errorContainer = document.getElementById("error-state-container");
    if (errorContainer) {
      errorContainer.style.display = "none";
    }

    // Mostrar la aplicación principal nuevamente
    appContainer.classList.remove("d-none");
  },

  showLoadingState: (message = translate("loading")) => {
    const loadingHtml = `
      <div class="loading-state text-center py-5">
        <div class="spinner-border text-primary mb-3" role="status">
          <span class="visually-hidden">${translate("loading")}</span>
        </div>
        <p class="text-muted">${message}</p>
      </div>
    `;

    let loadingContainer = document.getElementById("loading-state-container");
    if (!loadingContainer) {
      loadingContainer = document.createElement("div");
      loadingContainer.id = "loading-state-container";
      loadingContainer.className = "loading-container";
      document.body.appendChild(loadingContainer);
    }

    loadingContainer.innerHTML = loadingHtml;
    loadingContainer.style.display = "block";
  },

  hideLoadingState: () => {
    const loadingContainer = document.getElementById("loading-state-container");
    if (loadingContainer) {
      loadingContainer.style.display = "none";
    }
  },
};
const LoadingManager = {
  show: (message = translate("loading")) => {
    ErrorStates.showLoadingState(message);
  },

  hide: () => {
    ErrorStates.hideLoadingState();
  },

  // Para operaciones async con auto-loading
  wrap: async (promise, message = translate("processing")) => {
    LoadingManager.show(message);
    try {
      const result = await promise;
      return result;
    } finally {
      LoadingManager.hide();
    }
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
            <h5 class="modal-title">${translate("confirm")}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <p id="confirmationMessage"></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" id="confirmCancelBtn">${translate(
              "cancelButton"
            )}</button>
            <button type="button" class="btn btn-danger" id="confirmOkBtn">${translate(
              "accept"
            )}</button>
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
  /* console.log(
    "Estado de autenticación cambiado:",
    user ? "Usuario logueado" : "Usuario no logueado"
  ); */

  if (user) {
    currentUser = user;
    userInfo.textContent = `${translate("hello")}, ${
      user.displayName || user.email
    }`;

    // Ocultar login y mostrar app usando clases
    loginContainer.classList.add("d-none");
    appContainer.classList.remove("d-none");
    appContainer.classList.add("d-block");

    /*     console.log("Ocultando login, mostrando app");
     */
    // Set initial language from preferences
    setLanguage(currentLang);

    // Cargar datos del usuario desde Firestore
    await loadUserData();
    initApp();
  } else {
    currentUser = null;

    // ✅ Mostrar login y ocultar app usando clases
    loginContainer.classList.remove("d-none");
    appContainer.classList.add("d-none");
    appContainer.classList.remove("d-block");

    // Set initial language for login page
    setLanguage(currentLang);
    /*     console.log("Mostrando login, ocultando app");
     */
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
    await userCredential.user.updateProfile({
      displayName: name,
    });

    // Crear estructura inicial de datos para el nuevo usuario
    await initializeUserData();
    showAuthAlert(translate("accountCreated"), "success");
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
    showAuthAlert(translate("googleLoginSuccess"), "success");
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
  return translate(error.code) || error.message;
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
async function loadUserData() {
  if (!currentUser) return;

  ErrorStates.showLoadingState(translate("loadingData"));

  try {
    /*     console.log("🔍 Cargando datos para usuario:", currentUser.uid);
     */
    const userDoc = await db.collection("users").doc(currentUser.uid).get();

    if (userDoc.exists) {
      const data = userDoc.data();
      /*       console.log("✅ Datos cargados exitosamente");
       */
      // VALIDAR ESQUEMA DE DATOS
      if (DataValidation.validateUserData(data)) {
        students = data.students || {};
        sheets = data.sheets || [];
        classDays = data.classDays || [];
        currentSheet = sheets[0] || "";
      } else {
        console.warn("⚠️ Datos corruptos detectados. Reinicializando...");
        showToast(translate("inconsistentData"), "warning");
        await initializeUserData();
      }

      // Inicializar la aplicación
      initApp();
    } else {
      /*       console.log("🆕 Creando datos iniciales para nuevo usuario");
       */ await initializeUserData();
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
    showToast(translate("loadError"), "error");
  } finally {
    ErrorStates.hideLoadingState();
  }
}

// Guardar datos del usuario actual CON REINTENTOS
async function saveUserData() {
  if (!currentUser) {
    console.error("No hay usuario autenticado para guardar datos");
    return;
  }

  return await saveUserDataWithRetry();
}

// Función de reintentos inteligente
async function saveUserDataWithRetry(maxRetries = 3) {
  if (!currentUser) return;

  let loadingShown = false;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1 && !loadingShown) {
        ErrorStates.showLoadingState(translate("syncingData"));
        loadingShown = true;
      }

      // Pequeño delay progresivo entre intentos
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

      /*       console.log("✅ Datos guardados exitosamente");
       */ return;
    } catch (error) {
      console.error(`❌ Error en intento ${attempt}:`, error);

      // Si es el último intento, lanzar el error
      if (attempt === maxRetries) {
        console.error("❌ Todos los intentos fallaron");

        // Mostrar error específico según el tipo
        if (error.code === "failed-precondition") {
          throw new Error(translate("permissionError"));
        } else if (error.code === "unavailable") {
          throw new Error(translate("offlineError"));
        } else {
          throw error;
        }
      }

      // Si no es el último intento, continuar al siguiente
      /*       console.log(`🔄 Reintentando en ${attempt} segundos...`);
       */
    }
  }
  if (loadingShown) {
    ErrorStates.hideLoadingState();
  }
}

// Función auxiliar para operaciones con loading
async function withGlobalLoading(
  operation,
  loadingMessage = translate("processing")
) {
  ErrorStates.showLoadingState(loadingMessage);
  try {
    const result = await operation();
    return result;
  } finally {
    ErrorStates.hideLoadingState();
  }
}

// ===== APLICACIÓN PRINCIPAL =====

function initApp() {
  if (currentSheet && !students[currentSheet]) {
    students[currentSheet] = [];
  }
  renderSheets();
  initSorting();
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

  // Reiniciar estado de ordenación para la nueva hoja
  sortState = {
    column: "nombre",
    direction: "asc",
  };

  renderSheets();
  applySorting();
  updateSortUI();
  renderStudents();
  updateButtonsState();
}

// ===== ELIMINAR HOJA =====
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
      console.error("Error eliminando hoja:", error);
      showToast(translate("sheetDeleteError"), "error");
    }
  });
}

// ===== CALCULAR DÍAS DE CLASE =====
function calculateClassDays() {
  const allDates = new Set();

  if (currentSheet && students[currentSheet]) {
    students[currentSheet].forEach((student) => {
      Object.keys(student.asistencia || {}).forEach((date) => {
        if (student.asistencia[date]) {
          allDates.add(date);
        }
      });
    });
  }

  return Array.from(allDates).sort();
}

// ===== RENDER DE ESTUDIANTES =====
function renderStudents(filter = "") {
  try {
    tableBody.innerHTML = "";

    if (!currentSheet) {
      tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5">
          <div class="empty-state">
            <div>
              <h3 class="text-muted">${translate("noSheetSelected")}</h3>
              <p class="text-muted">${translate("noSheetSelectedBody")}</p>
              <button class="btn btn-primary" onclick="document.getElementById('newSheet').click()">
                <i class="fas fa-plus"></i> ${translate("createFirstSheet")}
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
              <h3 class="text-muted">${translate("noStudents")}</h3>
              <p class="text-muted">${translate("noStudentsBody")}</p>
              <button class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#studentModal">
                <i class="fas fa-plus"></i> ${translate("addFirstStudent")}
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

        // Crear contenido de notas con funcionalidad de gráfico
        const notasContent =
          st.notas.length > 0
            ? `<div style="cursor: pointer;" onclick="showStudentNotesChart(${idx})" title="${translate(
                "notesChartClickTitle"
              )}">
               <div class="d-flex align-items-center justify-content-center">
                 <span>${st.notas.join(", ")}</span>
                 <i class="fas fa-chart-line text-primary ms-2"></i>
               </div>
             </div>`
            : translate("noNotes");

        tr.innerHTML = `
        <td>${st.nombre}</td>
        <td>${notasContent}</td>
        <td><strong>${media || "-"}</strong></td>
        <td>${faltas} ${
          faltasJustificadas > 0
            ? translate("justifiedAbsences", faltasJustificadas)
            : ""
        }</td>
        <td>${retrasos}</td>
        <td><span class="badge ${
          porcentajeFaltasAlumno > 20 ? "bg-danger" : "bg-warning"
        }">${porcentajeFaltasAlumno}%</span></td>
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="editStudent(${idx})" title="${translate(
          "editButtonTitle"
        )}">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="deleteStudent(${idx})" title="${translate(
          "deleteButtonTitle"
        )}">
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
      totalDiasClase > 0 && totalAlumnos > 0
        ? (
            (totalFaltasNoJustificadas / (totalAlumnos * totalDiasClase)) *
            100
          ).toFixed(1)
        : 0;

    globalAbsenceEl.textContent = `${porcentajeFaltasGlobal}%`;
    totalClassDaysEl.textContent = totalDiasClase;

    updateStudentSelect();
  } catch (error) {
    console.error("Error renderizando estudiantes:", error);
    showToast(translate("renderError"), "error");
    tableBody.innerHTML = `<tr><td colspan="7">${translate(
      "renderErrorBody"
    )}</td></tr>`;
  }
}

// ===== ACTUALIZAR SELECT DE ESTUDIANTES =====
function updateStudentSelect() {
  studentSelect.innerHTML = "";
  if (!currentSheet) return;

  const optionDefault = document.createElement("option");
  optionDefault.textContent = translate("selectStudent");
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
    showToast(translate("addStudentSheetWarning"), "warning");
    return;
  }

  const rawName = document.getElementById("nameInput").value;
  const nombre = SecurityUtils.sanitizeStudentName(rawName);

  if (!nombre) {
    showToast(translate("studentNameEmpty"), "error");
    return;
  }

  // Verificar duplicados
  const isDuplicate = students[currentSheet].some(
    (student) => student.nombre.toLowerCase() === nombre.toLowerCase()
  );

  if (isDuplicate) {
    showToast(translate("studentNameDuplicate"), "error");
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
    showToast(translate("studentAdded"), "success");
  } catch (error) {
    console.error("Error guardando estudiante:", error);
    if (
      error.message.includes("Sin conexión") ||
      error.message.includes("No connection")
    ) {
      showToast(translate("studentSavedLocally"), "warning");
      // Los datos están en memoria, se sincronizarán cuando haya conexión
    } else {
      showToast(translate("studentSaveError", error.message), "error");
    }
  }
};

// ===== AÑADIR NOTA =====
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

  const nota = parseFloat(notaInput);
  students[currentSheet][idx].notas.push(nota);

  try {
    await saveUserData();
    renderStudents(searchBox.value);
    bootstrap.Modal.getInstance(document.getElementById("noteModal")).hide();
    document.getElementById("noteInput").value = "";
    showToast(translate("noteAdded"), "success");
  } catch (error) {
    console.error("Error guardando nota:", error);
    showToast(translate("noteSaveError"), "error");
  }
};

// ===== ELIMINAR ESTUDIANTE =====
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
      console.error("Error eliminando estudiante:", error);
      showToast(translate("studentDeleteError"), "error");
    }
  });
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
            <h5 class="modal-title">${translate("newSheetModalTitle")}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
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
        translate("sheetNameEmpty");
      return;
    }

    if (sheets.includes(name)) {
      document.getElementById("newSheetName").classList.add("is-invalid");
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
      console.error("Error creando hoja:", error);
      showToast(translate("sheetCreateError"), "error");
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
    alert(translate("attendanceSheetWarning"));
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
      ${translate("attendanceDateWarning")}
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
    showToast(translate("selectDate"), "error");
    return;
  }

  // Validar fecha
  if (!SecurityUtils.validateDate(fecha)) {
    showToast(translate("invalidDate"), "error");
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
      showToast(translate("attendanceSaved"), "success");
    } catch (error) {
      console.error("Error guardando asistencia:", error);
      showToast(translate("attendanceSaveError"), "error");
    }
  } else {
    bootstrap.Modal.getInstance(
      document.getElementById("attendanceModal")
    ).hide();
    showToast(translate("noAttendanceChanges"), "info");
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
           placeholder="${translate("notePlaceholder")}" data-index="${noteId}">
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

// ===== GUARDAR EDICIÓN ESTUDIANTE =====
document.getElementById("saveEditStudent").onclick = async () => {
  if (!currentSheet || editingStudentIndex === -1) return;

  const student = students[currentSheet][editingStudentIndex];

  // Actualizar nombre
  const rawName = document.getElementById("editStudentName").value;
  const newName = SecurityUtils.sanitizeStudentName(rawName);

  if (!newName) {
    showToast(translate("studentNameEmpty"), "error");
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
    showToast(translate("invalidNotesIgnored"), "warning");
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
    showToast(translate("studentUpdated"), "success");
  } catch (error) {
    console.error("Error guardando cambios:", error);
    showToast(translate("studentUpdateError"), "error");
  }
};

// ===== GRÁFICO DE NOTAS DEL ESTUDIANTE =====
let notesChart = null;

function showStudentNotesChart(studentIndex) {
  if (!currentSheet) return;

  const student = students[currentSheet][studentIndex];

  if (!student.notas || student.notas.length === 0) {
    showToast(translate("noNotesForChart"), "info");
    return;
  }

  // Actualizar título del modal
  document.getElementById("chartModalTitle").textContent = translate(
    "chartTitle",
    student.nombre
  );

  // Calcular estadísticas
  const average =
    student.notas.reduce((a, b) => a + b, 0) / student.notas.length;
  const totalNotes = student.notas.length;
  const trend = calculateTrend(student.notas);

  // Actualizar estadísticas
  document.getElementById("chartAverage").textContent = average.toFixed(2);
  document.getElementById("chartTotalNotes").textContent = totalNotes;
  document.getElementById("chartTrend").textContent = trend;

  // Crear o actualizar el gráfico
  renderNotesChart(student.notas, student.nombre);

  // Mostrar modal
  const chartModal = new bootstrap.Modal(
    document.getElementById("notesChartModal")
  );
  chartModal.show();
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

function renderNotesChart(notes, studentName) {
  const ctx = document.getElementById("notesChart").getContext("2d");

  // Destruir gráfico anterior si existe
  if (notesChart) {
    notesChart.destroy();
  }

  // Preparar datos
  const labels = notes.map(
    (_, index) => `${translate("chartLabelNote")} ${index + 1}`
  );
  const data = notes;

  // Calcular línea de tendencia
  const trendLine = calculateTrendLine(data);

  notesChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: translate("tableHeaderNotes"),
          data: data,
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
          data: trendLine,
          borderColor: "#dc3545",
          borderWidth: 2,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
          tension: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          ticks: {
            stepSize: 1,
          },
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
        },
        x: {
          grid: {
            color: "rgba(0, 0, 0, 0.1)",
          },
        },
      },
      plugins: {
        legend: {
          display: true,
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `${translate(
                "chartLabelNote"
              )}: ${context.parsed.y.toFixed(2)}`;
            },
          },
        },
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
    },
  });
}

function calculateTrendLine(data) {
  if (data.length === 0) return [];

  const n = data.length;
  const x = data.map((_, i) => i);
  const y = data;

  // Calcular pendiente e intercepto (regresión lineal simple)
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return x.map((xi) => slope * xi + intercept);
}

// Limpiar gráfico cuando se cierre el modal
document
  .getElementById("notesChartModal")
  .addEventListener("hidden.bs.modal", function () {
    if (notesChart) {
      notesChart.destroy();
      notesChart = null;
    }
  });

// ===== TEMA OSCURO/CLARO =====
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("dark-theme");
};

// ===== INTERNACIONALIZACIÓN =====
document.getElementById("langToggle").onclick = () => {
  const newLang = currentLang === "es" ? "en" : "es";
  setLanguage(newLang);
};

// Set initial language on first load
document.addEventListener("DOMContentLoaded", () => {
  setLanguage(currentLang);
});
