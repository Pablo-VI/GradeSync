let students = JSON.parse(localStorage.getItem("students")) || {};
let sheets = JSON.parse(localStorage.getItem("sheets")) || [];
let currentSheet = sheets[0] || "";

const tableBody = document.querySelector("#studentsTable tbody");
const globalAvgEl = document.getElementById("globalAvg");
const globalAbsenceEl = document.getElementById("globalAbsence");
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

// ===== Variables para edición =====
let editingStudentIndex = -1;

// ===== Inicialización =====
function init() {
  if (currentSheet && !students[currentSheet]) students[currentSheet] = [];
  renderSheets();
  renderStudents();
  updateButtonsState();
}

// ===== Render de pestañas =====
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

  // Actualizar estado de botones después de renderizar pestañas
  updateButtonsState();
}

// ===== Gestión de botones =====
function updateButtonsState() {
  const hasSheet = !!currentSheet;

  actionButtons.forEach((btn) => {
    if (!btn) return;

    btn.disabled = !hasSheet;

    if (hasSheet) {
      btn.classList.remove("btn-secondary");
      // Restaurar clase original
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

// ===== Cambiar hoja =====
function changeSheet(sheet) {
  currentSheet = sheet;
  if (!students[currentSheet]) students[currentSheet] = [];
  renderSheets();
  renderStudents();
  updateButtonsState(); // ✅ Actualizar botones inmediatamente
}

// ===== Eliminar hoja =====
function deleteSheet(sheetName) {
  if (
    !confirm(
      `¿Estás seguro de eliminar la hoja "${sheetName}" y todos sus datos?`
    )
  )
    return;

  sheets = sheets.filter((s) => s !== sheetName);
  delete students[sheetName];

  currentSheet = sheets[0] || ""; // Puede quedar vacío si era la última

  localStorage.setItem("sheets", JSON.stringify(sheets));
  localStorage.setItem("students", JSON.stringify(students));

  renderSheets();
  renderStudents(searchBox.value);
  updateButtonsState(); // ✅ Actualizar botones inmediatamente después de eliminar
}

// ===== Render de estudiantes =====
function renderStudents(filter = "") {
  tableBody.innerHTML = "";

  if (!currentSheet) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">📄 No hay hoja seleccionada</td></tr>`;
    globalAvgEl.textContent = "0";
    globalAbsenceEl.textContent = "0%";
    updateStudentSelect();
    updateButtonsState();
    return;
  }

  const alumnos = students[currentSheet] || [];
  let totalNotas = 0,
    totalAlumnos = 0,
    totalFaltasNoJustificadas = 0;

  // Calcular el total de días de clase (todas las fechas únicas de asistencia)
  const diasClase = new Set();
  alumnos.forEach((alumno) => {
    Object.keys(alumno.asistencia || {}).forEach((fecha) => {
      diasClase.add(fecha);
    });
  });
  const totalDiasClase = diasClase.size;

  alumnos
    .filter((st) => st.nombre.toLowerCase().includes(filter.toLowerCase()))
    .forEach((st, idx) => {
      const media =
        st.notas.length > 0
          ? (st.notas.reduce((a, b) => a + b, 0) / st.notas.length).toFixed(2)
          : "0.00";

      let trClass =
        media < 5 ? "tr-rojo" : media < 7 ? "tr-amarillo" : "tr-verde";

      totalNotas += parseFloat(media);
      totalAlumnos++;

      // Calcular faltas no justificadas para este alumno
      const asistencia = st.asistencia || {};
      const faltasNoJustificadas = Object.values(asistencia).filter(
        (tipo) => tipo === "falta"
      ).length;
      totalFaltasNoJustificadas += faltasNoJustificadas;

      // Porcentaje de faltas para el alumno
      const porcentajeFaltasAlumno =
        totalDiasClase > 0
          ? ((faltasNoJustificadas / totalDiasClase) * 100).toFixed(1)
          : 0;

      const tr = document.createElement("tr");
      tr.className = trClass;
      tr.innerHTML = `
        <td>${st.nombre}</td>
        <td>${st.notas.join(", ")}</td>
        <td>${media}</td>
        <td>${faltasNoJustificadas} (${porcentajeFaltasAlumno}%)</td>
        <td>${
          Object.values(asistencia).filter((tipo) => tipo === "retraso").length
        }</td>
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="editStudent(${idx})">✏️</button>
          <button class="btn btn-sm btn-danger" onclick="deleteStudent(${idx})">🗑</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

  globalAvgEl.textContent = totalAlumnos
    ? (totalNotas / totalAlumnos).toFixed(2)
    : "0";

  // Porcentaje global de faltas
  const porcentajeFaltasGlobal =
    totalAlumnos && totalDiasClase
      ? (
          (totalFaltasNoJustificadas / (totalAlumnos * totalDiasClase)) *
          100
        ).toFixed(1)
      : 0;
  globalAbsenceEl.textContent = `${porcentajeFaltasGlobal}%`;

  localStorage.setItem("students", JSON.stringify(students));
  updateStudentSelect();
}

// ===== Actualizar select de estudiantes =====
function updateStudentSelect() {
  studentSelect.innerHTML = "";
  if (!currentSheet) return;
  (students[currentSheet] || []).forEach((st, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = st.nombre;
    studentSelect.appendChild(opt);
  });
}

// ===== Añadir estudiante =====
document.getElementById("saveStudent").onclick = () => {
  if (!currentSheet) {
    alert("⚠️ Debes crear o seleccionar una hoja antes de añadir estudiantes.");
    return;
  }
  const nombre = document.getElementById("nameInput").value.trim();
  if (nombre) {
    students[currentSheet].push({ nombre, notas: [], asistencia: {} });
    renderStudents(searchBox.value);
    bootstrap.Modal.getInstance(document.getElementById("studentModal")).hide();
    document.getElementById("nameInput").value = "";
  }
};

// ===== Añadir nota =====
document.getElementById("saveNote").onclick = () => {
  if (!currentSheet) {
    alert("⚠️ Debes crear o seleccionar una hoja antes de añadir notas.");
    return;
  }
  const idx = studentSelect.value;
  const nota = parseFloat(document.getElementById("noteInput").value);
  if (idx !== "" && !isNaN(nota) && nota >= 0 && nota <= 10) {
    students[currentSheet][idx].notas.push(nota);
    renderStudents(searchBox.value);
    bootstrap.Modal.getInstance(document.getElementById("noteModal")).hide();
    document.getElementById("noteInput").value = "";
  }
};

// ===== Eliminar estudiante =====
function deleteStudent(idx) {
  if (!currentSheet) return;
  students[currentSheet].splice(idx, 1);
  renderStudents(searchBox.value);
}

// ===== Buscar =====
searchBox.addEventListener("input", () => renderStudents(searchBox.value));

// ===== Crear nueva hoja =====
document.getElementById("newSheet").onclick = () => {
  const name = prompt("Nombre de la nueva hoja:");
  if (name) {
    if (sheets.includes(name)) {
      alert("⚠️ Ya existe una hoja con ese nombre.");
      return;
    }
    sheets.push(name);
    students[name] = [];
    localStorage.setItem("sheets", JSON.stringify(sheets));
    changeSheet(name);
  }
};

// ===== Gestión de Asistencia =====
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

  // Establecer la fecha actual por defecto
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("attendanceDate").value = today;

  (students[currentSheet] || []).forEach((student, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${student.nombre}</td>
      <td>
        <input type="checkbox" class="attendance-falta" data-index="${index}">
      </td>
      <td>
        <input type="checkbox" class="attendance-retraso" data-index="${index}">
      </td>
    `;
    attendanceTableBody.appendChild(row);

    // Obtener los checkboxes de esta fila
    const faltaCheckbox = row.querySelector(".attendance-falta");
    const retrasoCheckbox = row.querySelector(".attendance-retraso");

    // Evento para falta: si se marca, desmarcar retraso
    faltaCheckbox.addEventListener("change", function () {
      if (this.checked) {
        retrasoCheckbox.checked = false;
      }
    });

    // Evento para retraso: si se marca, desmarcar falta
    retrasoCheckbox.addEventListener("change", function () {
      if (this.checked) {
        faltaCheckbox.checked = false;
      }
    });
  });
};

// Guardar asistencia
document.getElementById("saveAttendance").onclick = () => {
  if (!currentSheet) return;

  const fecha = document.getElementById("attendanceDate").value;
  if (!fecha) {
    alert("Por favor, selecciona una fecha.");
    return;
  }

  document.querySelectorAll(".attendance-falta").forEach((checkbox) => {
    const index = checkbox.getAttribute("data-index");
    if (checkbox.checked) {
      students[currentSheet][index].asistencia[fecha] = "falta";
    }
  });

  document.querySelectorAll(".attendance-retraso").forEach((checkbox) => {
    const index = checkbox.getAttribute("data-index");
    if (checkbox.checked) {
      students[currentSheet][index].asistencia[fecha] = "retraso";
    }
  });

  // Recorremos todos los alumnos y si no están marcados ni falta ni retraso, eliminamos la asistencia de esa fecha.
  (students[currentSheet] || []).forEach((student, index) => {
    const faltaCheckbox = document.querySelector(
      `.attendance-falta[data-index="${index}"]`
    );
    const retrasoCheckbox = document.querySelector(
      `.attendance-retraso[data-index="${index}"]`
    );

    if (!faltaCheckbox.checked && !retrasoCheckbox.checked) {
      // Si no hay marca, quitamos la asistencia de ese día (si existía)
      if (student.asistencia && student.asistencia[fecha]) {
        delete student.asistencia[fecha];
      }
    }
  });

  localStorage.setItem("students", JSON.stringify(students));
  renderStudents(searchBox.value);
  bootstrap.Modal.getInstance(
    document.getElementById("attendanceModal")
  ).hide();
};

// ===== Funciones de Edición de Estudiantes =====
function editStudent(index) {
  if (!currentSheet) return;

  editingStudentIndex = index;
  const student = students[currentSheet][index];

  // Llenar el formulario con los datos actuales
  document.getElementById("editStudentName").value = student.nombre;

  // Llenar notas
  const notesContainer = document.getElementById("editNotesContainer");
  notesContainer.innerHTML = "";
  student.notas.forEach((note, noteIndex) => {
    addNoteField(note, noteIndex);
  });

  // Llenar asistencia por fecha
  const attendanceContainer = document.getElementById(
    "editAttendanceContainer"
  );
  attendanceContainer.innerHTML = "";
  const asistencia = student.asistencia || {};
  Object.keys(asistencia).forEach((fecha) => {
    addAttendanceField(fecha, asistencia[fecha]);
  });

  // Mostrar modal
  const editModal = new bootstrap.Modal(
    document.getElementById("editStudentModal")
  );
  editModal.show();
}

function addAttendanceField(fecha = "", tipo = "") {
  const container = document.getElementById("editAttendanceContainer");
  const attendanceId = Date.now(); // ID único para esta fila

  const attendanceDiv = document.createElement("div");
  attendanceDiv.className = "input-group mb-2";
  attendanceDiv.innerHTML = `
    <input type="date" class="form-control attendance-date" value="${fecha}">
    <select class="form-select attendance-type">
      <option value="">Presente</option>
      <option value="falta" ${tipo === "falta" ? "selected" : ""}>Falta</option>
      <option value="retraso" ${
        tipo === "retraso" ? "selected" : ""
      }>Retraso</option>
      <option value="justificada" ${
        tipo === "justificada" ? "selected" : ""
      }>Falta Justificada</option>
    </select>
    <button class="btn btn-outline-danger" type="button" onclick="removeAttendanceField(this)">
      🗑
    </button>
  `;
  container.appendChild(attendanceDiv);
}

function removeAttendanceField(button) {
  button.parentElement.remove();
}

// ===== Función para añadir campo de nota =====
function addNoteField(value = "", index = null) {
  const container = document.getElementById("editNotesContainer");
  if (!container) {
    console.error(
      'No se encontró el contenedor de notas con id "editNotesContainer"'
    );
    return;
  }

  const noteId = index !== null ? index : Date.now();

  const noteDiv = document.createElement("div");
  noteDiv.className = "input-group mb-2";
  noteDiv.innerHTML = `
    <input type="number" class="form-control note-input" 
           value="${value}" step="0.01" min="0" max="10" 
           placeholder="Nota (0-10)" data-index="${noteId}">
    <button class="btn btn-outline-danger" type="button" onclick="removeNoteField(this)">
      🗑
    </button>
  `;
  container.appendChild(noteDiv);
}

// ===== Función para eliminar campo de nota =====
function removeNoteField(button) {
  button.parentElement.remove();
}

// ===== Guardar cambios del estudiante =====
document.getElementById("saveEditStudent").onclick = () => {
  if (!currentSheet || editingStudentIndex === -1) return;

  const student = students[currentSheet][editingStudentIndex];

  // Actualizar nombre
  const newName = document.getElementById("editStudentName").value.trim();
  if (!newName) {
    alert("El nombre no puede estar vacío");
    return;
  }
  student.nombre = newName;

  // Actualizar notas
  student.notas = [];
  document.querySelectorAll(".note-input").forEach((input) => {
    const value = parseFloat(input.value);
    if (!isNaN(value) && value >= 0 && value <= 10) {
      student.notas.push(value);
    }
  });

  // Actualizar asistencia
  student.asistencia = {};
  document.querySelectorAll(".attendance-date").forEach((dateInput, index) => {
    const fecha = dateInput.value;
    const tipo = document.querySelectorAll(".attendance-type")[index].value;
    if (fecha && tipo) {
      student.asistencia[fecha] = tipo;
    }
  });

  // Guardar y actualizar
  localStorage.setItem("students", JSON.stringify(students));
  renderStudents(searchBox.value);

  // Cerrar modal
  bootstrap.Modal.getInstance(
    document.getElementById("editStudentModal")
  ).hide();
  editingStudentIndex = -1;
};

// ===== Función para actualizar asistencia =====
function updateStudentAttendance(student) {
  const nuevasFaltas =
    parseInt(document.getElementById("editFaltas").value) || 0;
  const nuevosRetrasos =
    parseInt(document.getElementById("editRetrasos").value) || 0;

  // Obtener asistencia actual
  const asistenciaActual = student.asistencia || {};
  const fechasExistentes = Object.keys(asistenciaActual);

  // Contar faltas y retrasos actuales
  const faltasActuales = fechasExistentes.filter(
    (f) => asistenciaActual[f] === "falta"
  ).length;
  const retrasosActuales = fechasExistentes.filter(
    (f) => asistenciaActual[f] === "retraso"
  ).length;

  // Calcular diferencia
  const diffFaltas = nuevasFaltas - faltasActuales;
  const diffRetrasos = nuevosRetrasos - retrasosActuales;

  // Actualizar faltas
  if (diffFaltas > 0) {
    // Añadir faltas
    for (let i = 0; i < diffFaltas; i++) {
      const fecha = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];
      asistenciaActual[fecha] = "falta";
    }
  } else if (diffFaltas < 0) {
    // Eliminar faltas
    let eliminadas = 0;
    for (const fecha in asistenciaActual) {
      if (
        asistenciaActual[fecha] === "falta" &&
        eliminadas < Math.abs(diffFaltas)
      ) {
        delete asistenciaActual[fecha];
        eliminadas++;
      }
    }
  }

  // Actualizar retrasos
  if (diffRetrasos > 0) {
    // Añadir retrasos
    for (let i = 0; i < diffRetrasos; i++) {
      const fecha = new Date(
        Date.now() - (i + diffFaltas) * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0];
      asistenciaActual[fecha] = "retraso";
    }
  } else if (diffRetrasos < 0) {
    // Eliminar retrasos
    let eliminados = 0;
    for (const fecha in asistenciaActual) {
      if (
        asistenciaActual[fecha] === "retraso" &&
        eliminados < Math.abs(diffRetrasos)
      ) {
        delete asistenciaActual[fecha];
        eliminados++;
      }
    }
  }

  student.asistencia = asistenciaActual;
}

// ===== Tema oscuro/claro =====
document.getElementById("themeToggle").onclick = () => {
  document.body.classList.toggle("dark-theme");
  // Guardar preferencia en localStorage si lo deseas
};

// ===== Internacionalización =====
document.getElementById("langToggle").onclick = () => {
  // Aquí puedes implementar la lógica de cambio de idioma
  alert("Funcionalidad de cambio de idioma por implementar");
};

init();
