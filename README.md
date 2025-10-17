# GradeSync

<div align="center">
  <img src="assets/icon.svg" alt="GradeSync Logo" width="100"/>
</div>

<h3 align="center">Una aplicación web intuitiva para la gestión de estudiantes, notas y asistencia.</h3>

<p align="center">
  <a href="https://pablo-vi.github.io/GradeSync/"><strong>Visitar sitio »</strong></a>
</p>

---

![Captura de pantalla de GradeSync](https://raw.githubusercontent.com/Pablo-VI/GradeSync/main/docs/Captura_de_pantalla_de_GradeSync.png)

## 📝 Descripción / Description

**GradeSync** es una herramienta web moderna y responsiva diseñada para ayudar a profesores y educadores a simplificar la gestión de sus clases. Permite llevar un registro centralizado y eficiente del rendimiento académico y la asistencia de los estudiantes, todo desde una interfaz limpia, rápida y accesible desde cualquier dispositivo.

El proyecto nace de la necesidad de tener una solución digital que sea fácil de usar, segura y que ofrezca las funcionalidades esenciales sin la complejidad de otros sistemas de gestión académica.

---

## ✨ Características Principales / Key Features

- **Gestión de Estudiantes**: Añade, edita y elimina estudiantes de tus listas de clase de forma sencilla.
- **Seguimiento de Notas**: Registra las calificaciones de cada estudiante y visualiza su media de forma automática.
- **Control de Asistencia**: Lleva un registro diario de las faltas y retrasos de los alumnos.
- **Sistema Multi-Hoja**: Organiza a tus estudiantes por clases, asignaturas o grupos utilizando un sistema de pestañas intuitivo.
- **Visualización de Datos**: Analiza el progreso de un estudiante a lo largo del tiempo con gráficos de evolución de notas.
- **Búsqueda y Ordenación**: Encuentra estudiantes rápidamente con la barra de búsqueda y ordena las columnas de la tabla para analizar los datos a tu conveniencia.
- **Tema Claro y Oscuro**: Cambia entre dos temas visuales para adaptar la interfaz a tus preferencias y reducir la fatiga visual.
- **Soporte Bilingüe**: La interfaz está disponible tanto en **español** como en **inglés**.
- **Diseño Responsivo**: Accede y utiliza todas las funcionalidades de GradeSync desde tu ordenador, tablet o teléfono móvil.
- **Autenticación Segura**: Cada cuenta de usuario está protegida y sus datos son privados, gracias a la autenticación de Firebase (Email/Contraseña y Google).

---

## 🔧 Herramientas y Tecnologías / Tools & Technologies

Este proyecto fue construido utilizando tecnologías web modernas, enfocándose en la eficiencia, seguridad y una excelente experiencia de usuario.

### **Frontend**

- **HTML5**: Estructura semántica del contenido.
- **CSS3**: Estilos personalizados, incluyendo un layout moderno con Flexbox y Media Queries para el diseño responsivo.
- **JavaScript (ES6+)**: Toda la lógica de la aplicación, manipulación del DOM y gestión de datos del lado del cliente.
- **Bootstrap 5**: Framework CSS para un diseño responsivo rápido y componentes de UI consistentes.
- **Font Awesome**: Biblioteca de iconos para mejorar la usabilidad de la interfaz.
- **Chart.js**: Para la creación de los gráficos de evolución de notas, proporcionando una visualización de datos clara y dinámica.

### **Backend y Servicios**

- **Firebase**: Utilizado como el backend principal para:
  - **Firebase Authentication**: Gestiona el registro y login de usuarios de forma segura, incluyendo proveedores como Google.
  - **Firestore Database**: Base de datos NoSQL en la nube para almacenar y sincronizar en tiempo real los datos de cada usuario (estudiantes, notas, hojas, etc.).

### **Despliegue**

- **Git y GitHub**: Para el control de versiones del código.
- **GitHub Pages**: Para el alojamiento y despliegue de la aplicación web estática.

---

## 🚀 Tutorial de Uso / How to Use

¡Empezar a usar GradeSync es muy fácil! Sigue estos pasos:

### **1. Registro e Inicio de Sesión**

- **Crear una cuenta**: En la pantalla de inicio, haz clic en "Crear Nueva Cuenta". Rellena tu nombre, correo y contraseña.
- **Iniciar sesión**: Si ya tienes una cuenta, simplemente introduce tu correo y contraseña. También puedes usar el botón "Continuar con Google" para un acceso más rápido.

### **2. Crear tu Primera Hoja (Clase)**

- Una "Hoja" representa una clase, asignatura o grupo de estudiantes. Para empezar, necesitas crear una.
- Haz clic en el botón **"Nueva Hoja"**.
- Dale un nombre (ej. "Matemáticas 1ºA") y guárdala.

### **3. Añadir Estudiantes**

- Con tu hoja ya creada y seleccionada, haz clic en el botón **"Añadir Estudiante"**.
- Escribe el nombre completo del estudiante en la ventana que aparece y guarda.
- Repite el proceso para todos los estudiantes de esa clase.

### **4. Registrar Notas**

- Haz clic en el botón **"Añadir Nota"**.
- En la ventana modal, **selecciona el estudiante** de la lista desplegable.
- Introduce la nota (de 0 a 10) y haz clic en "Guardar".
- Verás que la tabla se actualiza automáticamente con la nueva nota y la media del estudiante.

### **5. Pasar Lista (Asistencia)**

- Haz clic en el botón **"Asistencia"**.
- Selecciona la fecha de la clase.
- Marca el estado de cada estudiante: "Asistió", "Falta" o "Retraso".
- Al guardar, la tabla principal actualizará el recuento de faltas y retrasos.

### **6. Analizar el Progreso**

- **Estadísticas globales**: En la parte inferior, siempre verás la media global de la clase, el porcentaje de faltas y el total de días de clase registrados.
- **Gráfico de evolución**: En la tabla, haz clic en la celda de las notas de cualquier estudiante para abrir un gráfico que muestra su progreso a lo largo del tiempo.

### **7. Gestionar y Organizar**

- **Buscar**: Usa la barra de búsqueda para filtrar la lista de estudiantes por su nombre.
- **Ordenar**: Haz clic en los encabezados de las columnas (Nombre, Media, Faltas, etc.) para ordenar la tabla y analizar los datos.
- **Editar/Eliminar**: Usa los botones de acción (el lápiz y la papelera) al final de cada fila para modificar los datos de un estudiante o eliminarlo.

---

## 🎨 Capturas de Pantalla / Screenshots

**Modo Oscuro**
![Captura de pantalla del modo oscuro](https://raw.githubusercontent.com/Pablo-VI/GradeSync/main/docs/Dark_mode.png)

**Vista en Móvil**
![Captura de pantalla en móvil](https://raw.githubusercontent.com/Pablo-VI/GradeSync/main/docs/Phone_mode.png)

---

## 👨‍💻 Autor / Author

**Pablo Almellones Ramos**

- GitHub: [Pablo-VI](https://github.com/Pablo-VI)
