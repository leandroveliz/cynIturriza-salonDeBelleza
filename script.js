// Módulo principal: carrusel, turnos y Firebase
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDanr5jf5gJDJ-4XjLrWJZRrpvJgZ4oR-g",
  authDomain: "espacio-belleza-cyn-9ac1e.firebaseapp.com",
  projectId: "espacio-belleza-cyn-9ac1e",
  storageBucket: "espacio-belleza-cyn-9ac1e.firebasestorage.app",
  messagingSenderId: "261129332365",
  appId: "1:261129332365:web:7afd5e9b77ee354ac724c4",
  measurementId: "G-REP11RK7F3"
};

// Evitar re-inicializar la app si ya fue creada en otra página/script
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}
const db = getFirestore(app);

// Carrusel de testimonios en index.html
document.addEventListener('DOMContentLoaded', function() {
  const testimonios = document.querySelectorAll('#testimonios-carrusel span');
  if (testimonios.length) {
    let idx = 0;
    function mostrarTestimonio(i) {
      testimonios.forEach((t, j) => {
        t.classList.remove('testimonio-activo');
        t.style.fontWeight = 'normal';
      });
      testimonios[i].classList.add('testimonio-activo');
      testimonios[i].style.fontWeight = 'bold';
    }
    // Mostrar el primer testimonio
    mostrarTestimonio(idx);
    // Cambiar inmediatamente al segundo testimonio si hay más de uno
    if (testimonios.length > 1) {
      idx = 1;
      setTimeout(() => {
        mostrarTestimonio(idx);
      }, 1000); // Cambia al segundo testimonio tras 1 segundo
    }
    // Luego rota cada 10 segundos
    setInterval(() => {
      idx = (idx + 1) % testimonios.length;
      mostrarTestimonio(idx);
    }, 10000);
  }
});
// Formulario de reclamos
const formReclamo = document.getElementById("formReclamo");
if (formReclamo) {
  formReclamo.addEventListener("submit", function(e) {
    e.preventDefault();
    const nombre = document.getElementById("nombreReclamo").value;
    const email = document.getElementById("emailReclamo").value;
    const detalle = document.getElementById("detalleReclamo").value;
    const mensaje = document.getElementById("mensajeReclamo");
    mensaje.textContent = `¡Reclamo enviado! Gracias, ${nombre}. Nos contactaremos a ${email}.`;
    mensaje.style.display = "block";
    formReclamo.reset();
    setTimeout(() => { mensaje.style.display = "none"; }, 6000);
  });
}
const form = document.getElementById("turnoForm");
    const lista = document.getElementById("listaTurnos");
    const horaSelect = document.getElementById("hora");
    const fechaInput = document.getElementById("fecha");

    const turnos = {}; // Guardar turnos por fecha (sincronizado con Firestore)

// Cargar turnos desde Firestore filtrando por fecha (rango [fecha, fecha+1))
async function cargarTurnosParaFecha(fecha) {
  try {
    // Asegurarnos de inicializar el array para esa fecha
    turnos[fecha] = [];
    // Calcular siguiente día en formato YYYY-MM-DD
    const parts = fecha.split('-').map(Number); // [YYYY,MM,DD]
    const fechaObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const next = new Date(fechaObj);
    next.setDate(next.getDate() + 1);
    const pad = (n) => n.toString().padStart(2, '0');
    const nextStr = `${next.getFullYear()}-${pad(next.getMonth() + 1)}-${pad(next.getDate())}`;

    const q = query(collection(db, 'turnos'), where('fecha', '>=', fecha), where('fecha', '<', nextStr));
    const snapshot = await getDocs(q);
    snapshot.forEach(doc => {
      const t = doc.data();
      // si t.hora existe, agregar a ocupados
      if (t.hora && !turnos[fecha].includes(t.hora)) turnos[fecha].push(t.hora);
      // normalizar en caso de que el campo fecha venga con hora
      // (la consulta por rango ya captura variantes ISO que comiencen con la fecha)
    });
  } catch (err) {
    console.error('Error cargando turnos desde Firestore para fecha', fecha, err);
    // mantener array vacío para evitar bloqueo accidental
    if (!turnos[fecha]) turnos[fecha] = [];
  }
}

    // Inicializar Flatpickr
    flatpickr(fechaInput, {
      dateFormat: "d-m-Y",  
      minDate: "today",
      disable: [
        function(date) {
          return (date.getDay() === 0); // Bloquear domingos
        }
      ],
      locale: {
        ...flatpickr.l10ns.es,
        firstDayOfWeek: 1 // Semana empieza en lunes
      },
      onChange: async function(selectedDates, dateStr) {
        if (selectedDates.length > 0 && selectedDates[0].getDay() === 0) {
          alert('No se pueden seleccionar domingos.');
          fechaInput._flatpickr.clear();
          return;
        }
        if (dateStr) {
          const isoFecha = selectedDates[0].toISOString().split("T")[0];
          fechaInput.dataset.iso = isoFecha;
          // Cargar desde Firestore los turnos para esa fecha y luego mostrar horas
          await cargarTurnosParaFecha(isoFecha);
          cargarHoras(isoFecha);
        }
      }
    });

    // Generar horarios de 09:00 a 20:00
    function generarHorarios() {
      const horarios = [];
      for (let h = 9; h <= 20; h++) {
        const horaStr = (h < 10 ? "0" : "") + h + ":00";
        horarios.push(horaStr);
      }
      return horarios;
    }

    // Cargar opciones de hora según la fecha
    function cargarHoras(fecha) {
      horaSelect.innerHTML = "";
      const horarios = generarHorarios();
      const ocupados = turnos[fecha] || [];

      // Comprobar si la fecha es hoy (en horario local)
      const ahora = new Date();
      const hoyLocal = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
      const fechaParts = fecha ? fecha.split('-').map(Number) : null; // [YYYY,MM,DD]
      let esHoy = false;
      if (fechaParts && fechaParts.length === 3) {
        const fechaObj = new Date(fechaParts[0], fechaParts[1] - 1, fechaParts[2]);
        esHoy = fechaObj.getTime() === hoyLocal.getTime();
      }

      horarios.forEach(hora => {
        // hora es 'HH:00' -> extraer hora numérica
        const horaNum = parseInt(hora.split(':')[0], 10);

        // Si la hora ya está ocupada, omitir
        if (ocupados.includes(hora)) return;

        // Si la fecha es hoy, filtrar horarios anteriores al momento actual
        if (esHoy) {
          const ahoraHora = ahora.getHours();
          const ahoraMin = ahora.getMinutes();
          // Si la hora del slot es menor que la hora actual -> ya pasó
          if (horaNum < ahoraHora) return;
          // Si la hora del slot es igual a la hora actual y ya pasaron minutos -> considerar pasado
          if (horaNum === ahoraHora && ahoraMin > 0) return;
        }

        const option = document.createElement("option");
        option.value = hora;
        option.textContent = hora;
        horaSelect.appendChild(option);
      });

      if (horaSelect.options.length === 0) {
        const option = document.createElement("option");
        option.textContent = "No hay turnos disponibles";
        option.disabled = true;
        horaSelect.appendChild(option);
      }
    }

    // Guardar el turno (ahora sincronizado con Firestore)
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const nombre = document.getElementById("nombre").value;
      const fecha = fechaInput.dataset.iso; 
      const hora = horaSelect.value;
      const email = document.getElementById("email").value;
      const servicio = document.getElementById("servicio").value;

      if (!nombre || !fecha || !hora || !email || !servicio) {
        mostrarMensaje("Por favor complete todos los campos.", false);
        return;
      }

      if (!turnos[fecha]) turnos[fecha] = [];
      if (turnos[fecha].includes(hora)) {
        mostrarMensaje("Ese turno ya está reservado. Elija otro horario.", false);
        return;
      }

      try {
        // Guardar en Firestore
        await addDoc(collection(db, 'turnos'), { nombre, telefono: document.getElementById('telefono') ? document.getElementById('telefono').value : '', email, fecha, hora, servicio, createdAt: new Date().toISOString() });
        // Actualizar variable local y UI
        turnos[fecha].push(hora);
        const li = document.createElement("li");
        li.textContent = `${nombre} - ${email} - ${servicio} - ${fecha} a las ${hora}`;
        if (lista) lista.appendChild(li);
        mostrarMensaje(`¡Turno generado correctamente! Servicio: ${servicio} | Fecha: ${fecha} - Hora: ${hora}`, true);
        form.reset();
        cargarHoras(fecha); // Actualizar opciones de hora para que el turno recién reservado ya no esté disponible
      } catch (err) {
        console.error('Error guardando turno en Firestore:', err);
        mostrarMensaje('Error al guardar el turno. Intente nuevamente.', false);
      }
    });

// Cancelar turno: buscar documento por fecha+hora+email y eliminarlo
const cancelarBtn = document.getElementById('cancelarBtn');
if (cancelarBtn) {
  cancelarBtn.addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const fecha = fechaInput && fechaInput.dataset ? fechaInput.dataset.iso : null;
    const hora = horaSelect ? horaSelect.value : null;

    if (!email || !fecha || !hora) {
      mostrarMensaje('Para cancelar debe completar Email, Fecha y Hora.', false);
      return;
    }

    try {
      cancelarBtn.disabled = true;
      // Buscar documentos que coincidan
      const q = query(collection(db, 'turnos'), where('fecha', '==', fecha), where('hora', '==', hora), where('email', '==', email));
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        mostrarMensaje('No se encontró ningún turno con esos datos.', false);
        cancelarBtn.disabled = false;
        return;
      }
      // Eliminar todos los documentos coincidentes
      for (const d of snapshot.docs) {
        await deleteDoc(d.ref);
      }
      // Actualizar almacenamiento local y UI
      if (turnos[fecha]) {
        const idx = turnos[fecha].indexOf(hora);
        if (idx !== -1) turnos[fecha].splice(idx, 1);
      }
      await cargarTurnosParaFecha(fecha);
      cargarHoras(fecha);
      // También eliminar de la lista visual si existe
      if (lista) {
        const items = Array.from(lista.querySelectorAll('li'));
        items.forEach(li => {
          if (li.textContent.includes(email) && li.textContent.includes(fecha) && li.textContent.includes(hora)) {
            li.remove();
          }
        });
      }
      mostrarMensaje('Turno cancelado correctamente.', true);
    } catch (err) {
      console.error('Error cancelando turno:', err);
      mostrarMensaje('Error al cancelar el turno. Intente nuevamente.', false);
    } finally {
      cancelarBtn.disabled = false;
    }
  });
}

    function mostrarMensaje(texto, exito) {
      const mensajeDiv = document.getElementById("mensajeTurno");
      const mensajeTexto = document.getElementById("mensajeTexto");
      mensajeTexto.textContent = texto;
      mensajeDiv.style.background = exito
        ? "linear-gradient(90deg,#e6ffe6 70%,#c6f7d4 100%)"
        : "linear-gradient(90deg,#ffe6e6 70%,#f7c6c6 100%)";
      mensajeDiv.style.color = exito ? "#207520" : "#a00";
      mensajeDiv.style.opacity = "0";
      mensajeDiv.style.display = "flex";
      setTimeout(() => { mensajeDiv.style.opacity = "1"; }, 50);
      setTimeout(() => {
        mensajeDiv.style.opacity = "0";
        setTimeout(() => { mensajeDiv.style.display = "none"; }, 500);
      }, 5000);
    }

    