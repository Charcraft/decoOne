import { crearSolicitudDesdeContacto } from '../components/api.js';

const SERVER_URL = 'http://localhost:7000';

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
    // Buscar TODOS los componentes desplegables en la página
    const wrappers = document.querySelectorAll('.caja-desplegable-wrapper');

    wrappers.forEach(wrapper => {
        const trigger = wrapper.querySelector('.caja-desplegable-trigger');
        const opcionesMenu = wrapper.querySelector('.opciones-desplegables');
        const inputOculto = wrapper.querySelector('input[type="hidden"]');
        const textoPlaceholder = trigger.querySelector('.placeholder-texto');

        // 1. Abrir/Cerrar el menú al hacer clic
        trigger.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Cerrar cualquier otro menú abierto
            document.querySelectorAll('.caja-desplegable-wrapper.abierto').forEach(w => {
                if (w !== wrapper) w.classList.remove('abierto');
            });
            
            wrapper.classList.toggle('abierto');
        });

        // 2. Dar funcionalidad a las opciones usando delegación de eventos 
        // (importante para las opciones de Salones que se cargan dinámicamente)
        opcionesMenu.addEventListener('click', function(e) {
            if (e.target.tagName === 'LI') {
                const opcion = e.target;
                
                textoPlaceholder.textContent = opcion.textContent;
                inputOculto.value = opcion.getAttribute('data-value');
                trigger.classList.add('seleccionado');
                wrapper.classList.remove('abierto');
            }
        });
    });

    // 3. Cerrar los menús si se hace clic fuera de ellos
    window.addEventListener('click', function() {
        document.querySelectorAll('.caja-desplegable-wrapper.abierto').forEach(w => {
            w.classList.remove('abierto');
        });
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('formularioContacto');
    if (!formulario) return;

    const usuarioCorreo = localStorage.getItem('usuarioCorreo');
    const inputCorreoFaq = document.getElementById('inputCorreoFaq');
    if (usuarioCorreo && inputCorreoFaq) {
        inputCorreoFaq.value = usuarioCorreo;
        inputCorreoFaq.setAttribute('readonly', true);
    }

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        // VALIDACIÓN DE SEGURIDAD: Comprobamos si el usuario está logueado
        // (Asumiremos que cuando hacen Login, guardamos su correo en localStorage)
        const usuarioLogueado = localStorage.getItem("usuarioCorreo");
        
        if (!usuarioLogueado) {
            mostrarToast('Por favor, inicia sesión para solicitar un evento.');
            setTimeout(() => window.location.href = '../auth/login.html', 1500);
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
            mostrarToast('Por favor selecciona el tipo de evento.');
            return;
        }

        botonEnviar.disabled = true;
        botonEnviar.textContent = 'Enviando...';

        try {
            await crearSolicitudDesdeContacto(nuevaSolicitud);
            mostrarToast("¡Solicitud enviada! Te contactaremos pronto. Revisa el estado en 'Mis Eventos'.");
            
            setTimeout(() => {
                formulario.reset();
                document.querySelector('.placeholder-texto').textContent = 'Tipo de evento';
                document.getElementById('cajaTrigger').classList.remove('seleccionado');
                if (usuarioCorreo && inputCorreoFaq) {
                    inputCorreoFaq.value = usuarioCorreo;
                }
            }, 2000);
        } catch (error) {
            console.error('Error al enviar la solicitud:', error);
            mostrarToast('Hubo un problema. Asegúrate de que el correo coincida con tu cuenta registrada.');
        } finally {
            botonEnviar.disabled = false;
            botonEnviar.textContent = textoOriginalBoton;
        }
    });
});
document.addEventListener('DOMContentLoaded', () => {
    // Seleccionamos el input de fecha de tu HTML
    const inputFecha = document.getElementById('inputFechaFaq');
    
    if (inputFecha) {
        const hoy = new Date();
        
        // OPCIONAL: Sumamos 7 días a la fecha actual para obligar al cliente 
        // a reservar con al menos una semana de anticipación. 
        // (Puedes cambiar el 7 por un 1 si solo quieres que sea a partir de mañana).
        hoy.setDate(hoy.getDate() + 7); 
        
        // Formateamos la fecha a YYYY-MM-DD, que es lo que entiende el input type="date"
        const fechaMinima = hoy.toISOString().split('T')[0];
        
        // Le aplicamos el atributo "min" al input
        inputFecha.setAttribute('min', fechaMinima);
    }
});

function mostrarToast(mensaje) {
    const toast = document.createElement('div');
    toast.textContent = mensaje;
    Object.assign(toast.style, {
        position: 'fixed', bottom: '20px', right: '20px',
        background: 'rgba(17, 42, 49, 0.95)', color: '#fff',
        padding: '12px 24px', borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: '14px',
        zIndex: '9999', opacity: '0', transform: 'translateY(20px)',
        transition: 'all 0.3s ease'
    });
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '1'; toast.style.transform = 'translateY(0)'; }, 10);
    setTimeout(() => {
        toast.style.opacity = '0'; toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
    // En lugar de selectSalon, buscamos la lista <ul> del menú personalizado
    const ulSalones = document.getElementById('opcionesMenuSalon');
    
    if (ulSalones) {
        try {
            const respuesta = await fetch(`${SERVER_URL}/api/salones`);
            const salones = await respuesta.json();
            
            salones.forEach(salon => {
                const li = document.createElement('li');
                li.setAttribute('data-value', salon.nombre);
                li.textContent = salon.nombre;
                ulSalones.appendChild(li);
            });
        } catch (error) {
            console.error('Error al cargar salones:', error);
        }
    }

});