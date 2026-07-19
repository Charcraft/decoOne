import { crearSolicitudDesdeContacto } from '../components/api.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Seleccionamos todos los botones de preguntas
    const preguntas = document.querySelectorAll('.preguntaFAQ');

    preguntas.forEach(pregunta => {
        pregunta.addEventListener('click', () => {
            const contenedor = pregunta.parentElement;
            const respuesta = pregunta.nextElementSibling;
            const estaAbierta = contenedor.classList.contains('activo');

            document.querySelectorAll('.botonPregunta.activo').forEach(elementoActivo => {
                elementoActivo.classList.remove('activo');
                elementoActivo.querySelector('.respuestaFAQ').style.maxHeight = null;
            });

            if (!estaAbierta) {
                contenedor.classList.add('activo');
                respuesta.style.maxHeight = respuesta.scrollHeight + 15 + "px";
            }
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.querySelector('.caja-desplegable-wrapper');
    const trigger = document.getElementById('cajaTrigger');
    const opciones = document.querySelectorAll('.opciones-desplegables li');
    const inputOculto = document.getElementById('tipoEventoValor');
    const textoPlaceholder = trigger.querySelector('.placeholder-texto');

    // 1. Abrir/Cerrar el menú al hacer clic en la caja principal
    trigger.addEventListener('click', function(e) {
        e.stopPropagation(); // Evita que el clic cierre el menú inmediatamente
        wrapper.classList.toggle('abierto');
    });

    // 2. Darle funcionalidad a cada opción de la lista
    opciones.forEach(opcion => {
        opcion.addEventListener('click', function() {
            // Reemplazar el texto "Tipo de evento" por la opción elegida
            textoPlaceholder.textContent = this.textContent;
            
            // Llenar el input oculto con el valor para que el formulario lo envíe
            inputOculto.value = this.getAttribute('data-value');
            
            // Cambiar el color del texto a blanco (estado seleccionado)
            trigger.classList.add('seleccionado');
            
            // Cerrar el menú
            wrapper.classList.remove('abierto');
        });
    });

    // 3. Cerrar el menú si el usuario hace clic en cualquier otra parte de la pantalla
    window.addEventListener('click', function(e) {
        if (!wrapper.contains(e.target)) {
            wrapper.classList.remove('abierto');
        }
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formularioContacto');
    if (!formulario) return;

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        // VALIDACIÓN DE SEGURIDAD: Comprobamos si el usuario está logueado
        // (Asumiremos que cuando hacen Login, guardamos su correo en localStorage)
        const usuarioLogueado = localStorage.getItem("usuarioCorreo");
        
        if (!usuarioLogueado) {
            alert('¡Hola! Para poder solicitar un evento y darle seguimiento, primero necesitas crear una cuenta o iniciar sesión.');
            window.location.href = '../auth/login.html'; // Redirige al login
            return; // Detiene la ejecución del formulario
        }

        const botonEnviar = formulario.querySelector('.botonEnviar');
        const textoOriginalBoton = botonEnviar.textContent;

        const nuevaSolicitud = {
            nombre: document.getElementById('inputNombreFaq').value.trim(),
            correo: document.getElementById('inputCorreoFaq').value.trim(), 
            telefono: document.getElementById('inputTelefonoFaq').value.trim(),
            tipoEvento: document.getElementById('tipoEventoValor').value,
            fechaEventoDeseada: document.getElementById('inputFechaFaq').value,
            salonDeseado: document.getElementById('inputSalonFaq').value.trim(),
            ideas: document.getElementById('inputIdeasFaq').value.trim() || 'Sin detalles adicionales.'
        };

        if (!nuevaSolicitud.tipoEvento) {
            alert('Por favor selecciona el tipo de evento.');
            return;
        }

        botonEnviar.disabled = true;
        botonEnviar.textContent = 'Enviando...';

        try {
            await crearSolicitudDesdeContacto(nuevaSolicitud);
            alert('¡Gracias! Tu solicitud fue enviada. Te contactaremos pronto y podrás ver el estado en "Mis Eventos".');
            formulario.reset();

            document.querySelector('.placeholder-texto').textContent = 'Tipo de evento';
            document.getElementById('cajaTrigger').classList.remove('seleccionado');
        } catch (error) {
            console.error('Error al enviar la solicitud:', error);
            alert('Hubo un problema. Asegúrate de que el correo coincida con tu cuenta registrada.');
        } finally {
            botonEnviar.disabled = false;
            botonEnviar.textContent = textoOriginalBoton;
        }
    });
});