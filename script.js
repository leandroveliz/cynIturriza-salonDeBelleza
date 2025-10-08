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

    const turnos = {}; // Guardar turnos por fecha

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
      onChange: function(selectedDates, dateStr) {
        if (selectedDates.length > 0 && selectedDates[0].getDay() === 0) {
          alert('No se pueden seleccionar domingos.');
          fechaInput._flatpickr.clear();
          return;
        }
        if (dateStr) {
          const isoFecha = selectedDates[0].toISOString().split("T")[0];
          cargarHoras(isoFecha);
          fechaInput.dataset.iso = isoFecha; 
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

      horarios.forEach(hora => {
        if (!ocupados.includes(hora)) {
          const option = document.createElement("option");
          option.value = hora;
          option.textContent = hora;
          horaSelect.appendChild(option);
        }
      });

      if (horaSelect.options.length === 0) {
        const option = document.createElement("option");
        option.textContent = "No hay turnos disponibles";
        option.disabled = true;
        horaSelect.appendChild(option);
      }
    }

    // Guardar el turno
    form.addEventListener("submit", (e) => {
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
      turnos[fecha].push(hora);

      // Mostrar en lista
      const li = document.createElement("li");
      li.textContent = `${nombre} - ${email} - ${servicio} - ${fecha} a las ${hora}`;
      lista.appendChild(li);

      mostrarMensaje(`¡Turno generado correctamente! Servicio: ${servicio} | Fecha: ${fecha} - Hora: ${hora}`, true);
      form.reset();
      cargarHoras(fecha); // Actualizar opciones de hora para que el turno recién reservado ya no esté disponible
    });

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

    