import { registrarUsuarioAPI, loginUsuarioAPI } from '../components/api.js'; 

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('token')) {
        window.location.href = '../../index.html';
        return;
    }

    inicializarSlider();
    inicializarFormularioLogin();
    inicializarFormularioRegistro();
    inicializarRecuperarContraseña();
    inicializarLinkRecuperar();
});

function inicializarSlider() {
    const botonInicio = document.querySelector('.botonInicioSesion');
    const botonRegistro = document.querySelector('.botonRegistro');
    const contenedorBotones = document.getElementById('contenedorBotones');
    const formLogin = document.getElementById('formularioLogin');
    const formRegistro = document.getElementById('formularioRegistro');
    const formRecuperar = document.getElementById('recuperarContraseña');

    function cambiarFormulario(formularioAMostrar, formulariosAOcultar) {
        formulariosAOcultar.forEach(formulario => {
            if (formulario.style.display === 'none') return;
            formulario.classList.add('ocultandose');
            setTimeout(() => {
                formulario.style.display = 'none';
                formulario.classList.remove('ocultandose');
            }, 300);
        });

        setTimeout(() => {
            formularioAMostrar.style.display = 'flex';
        }, 300);
    }

    botonInicio.addEventListener('click', () => {
        contenedorBotones.classList.remove('mover-derecha');
        botonInicio.classList.add('activo');
        botonRegistro.classList.remove('activo');
        cambiarFormulario(formLogin, [formRegistro, formRecuperar]);
    });

    botonRegistro.addEventListener('click', () => {
        contenedorBotones.classList.add('mover-derecha');
        botonRegistro.classList.add('activo');
        botonInicio.classList.remove('activo');
        cambiarFormulario(formRegistro, [formLogin, formRecuperar]);
    });
}

function inicializarFormularioLogin() {
    const formulario = document.getElementById('formularioLogin');

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const correo = formulario.querySelector('input[type="email"]').value.trim();
        const contraseña = formulario.querySelector('input[type="password"]').value;
        const botonEnviar = formulario.querySelector('button[type="submit"]');

        botonEnviar.disabled = true;
        botonEnviar.textContent = 'Iniciando sesión...';

        try {
            const datos = await loginUsuarioAPI(correo, contraseña);

            // Guardamos los datos de sesión
            localStorage.setItem('token', datos.token);
            localStorage.setItem('usuarioNombre', datos.usuario.nombre);
            localStorage.setItem('usuarioCorreo', datos.usuario.correo);
            localStorage.setItem('usuarioRol', datos.usuario.rol); // ✅ Guardamos el rol

            // ✅ Lógica de redirección por Rol
            if (datos.usuario.rol === 'decorador' || datos.usuario.rol === 'empleado') {
                alert('¡Bienvenido al Panel de Administración!');
                window.location.href = '../admin/dashboard.html'; // Ruta a tu panel de admin
            } else {
                // Si es un cliente normal, va al inicio de la página pública
                window.location.href = '../../index.html';
            }

        } catch (error) 
        {
            mostrarError(formulario, error.message);
            botonEnviar.disabled = false;
            botonEnviar.textContent = 'Iniciar sesión →';
        }
    });
}

function inicializarFormularioRegistro() {
    const formulario = document.getElementById('formularioRegistro');

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const nombre = formulario.querySelector('input[type="text"]').value.trim();
        const correo = formulario.querySelector('input[type="email"]').value.trim();
        const contraseña = formulario.querySelector('#resContraseña').value;
        const confirmarContraseña = formulario.querySelector('#confContraseña').value;
        const botonEnviar = formulario.querySelector('button[type="submit"]');

        botonEnviar.disabled = true;
        botonEnviar.textContent = 'Creando cuenta...';

        // ✅ VALIDACIÓN: Verificar que las contraseñas coincidan antes de ir a Java
        if (contraseña !== confirmarContraseña) {
            mostrarError(formulario, "Las contraseñas no coinciden.");
            botonEnviar.disabled = false;
            botonEnviar.textContent = 'Crear cuenta →';
            return;
        }

        try {
            // ✅ CAMBIO: Ahora enviamos los datos del nuevo cliente a MySQL usando Java
            const datos = await registrarUsuarioAPI(nombre, correo, contraseña);

            localStorage.setItem('token', datos.token);
            localStorage.setItem('usuarioNombre', datos.usuario.nombre);
            localStorage.setItem('usuarioCorreo', datos.usuario.correo);

            window.location.href = '../../index.html';
        } catch (error) {
            mostrarError(formulario, error.message);
            botonEnviar.disabled = false;
            botonEnviar.textContent = 'Crear cuenta →';
        }
    });
}

// Formulario: Recuperar contraseña (Se queda simulado por ahora)
function inicializarRecuperarContraseña() {
    const formulario = document.getElementById('recuperarContraseña');

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const correo = formulario.querySelector('input[type="email"]').value.trim();
        const botonEnviar = formulario.querySelector('button[type="submit"]');

        botonEnviar.disabled = true;
        botonEnviar.textContent = 'Enviando...';

        try {
            // Como no tenemos servidor de correos real, este se queda simulado de momento
            mostrarExito(formulario, 'Revisa tu correo para continuar (simulado — revisa la consola)');
            formulario.reset();
        } catch (error) {
            mostrarError(formulario, error.message);
        } finally {
            botonEnviar.disabled = false;
            botonEnviar.textContent = 'Enviar correo →';
        }
    });
}

function inicializarLinkRecuperar() {
    const link = document.getElementById('linkRecuperar');
    const formLogin = document.getElementById('formularioLogin');
    const formRecuperar = document.getElementById('recuperarContraseña');
    const botonInicio = document.querySelector('.botonInicioSesion');
    const botonRegistro = document.querySelector('.botonRegistro');

    link.addEventListener('click', (evento) => {
        evento.preventDefault();

        botonInicio.classList.remove('activo');
        botonRegistro.classList.remove('activo');

        formLogin.classList.add('ocultandose');
        setTimeout(() => {
            formLogin.style.display = 'none';
            formLogin.classList.remove('ocultandose');
            formRecuperar.style.display = 'flex';
        }, 300);
    });
}

function mostrarError(formulario, mensaje) {
    limpiarMensaje(formulario);
    const parrafo = document.createElement('p');
    parrafo.className = 'mensaje-error';
    parrafo.textContent = mensaje;
    formulario.appendChild(parrafo);
}

function mostrarExito(formulario, mensaje) {
    limpiarMensaje(formulario);
    const parrafo = document.createElement('p');
    parrafo.className = 'mensaje-exito';
    parrafo.textContent = mensaje;
    formulario.appendChild(parrafo);
}

function limpiarMensaje(formulario) {
    const existente = formulario.querySelector('.mensaje-error, .mensaje-exito');
    if (existente) existente.remove();
}