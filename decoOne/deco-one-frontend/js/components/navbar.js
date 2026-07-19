document.addEventListener('DOMContentLoaded', () => {
    actualizarNavbar();
    inicializarBotonCerrarSesion();
    inicializarMenuMovil();
});

function actualizarNavbar() {
    const token = localStorage.getItem('token');
    const sinRegistro = document.getElementById('sinRegistro');
    const conRegistro = document.getElementById('conRegistro');

    if (!sinRegistro || !conRegistro) return;

    if (token) {
        sinRegistro.classList.add('oculto');
        conRegistro.classList.remove('oculto');

        const usuario = {
            nombre: localStorage.getItem('usuarioNombre'),
            rol: localStorage.getItem('usuarioRol')
        };

        actualizarNombreUsuario(usuario.nombre);
        configurarMenuPorRol(usuario);
    } else {
        sinRegistro.classList.remove('oculto');
        conRegistro.classList.add('oculto');
    }
}

function actualizarNombreUsuario(nombre) {
    const span = document.getElementById('nombreUsuarioMenu');
    if (span && nombre) {
        span.textContent = nombre;
    }
}

function configurarMenuPorRol(usuario) {
    const itemsCliente = document.querySelectorAll('.item-cliente');
    const itemsDecorador = document.querySelectorAll('.item-decorador');

    if (usuario.rol === 'decorador') {
        itemsCliente.forEach(item => item.classList.add('ocultar-por-rol'));
        itemsDecorador.forEach(item => item.classList.remove('ocultar-por-rol'));
    } else {
        itemsCliente.forEach(item => item.classList.remove('ocultar-por-rol'));
        itemsDecorador.forEach(item => item.classList.add('ocultar-por-rol'));
    }
}

function inicializarBotonCerrarSesion() {
    const boton = document.getElementById('botonCerrarSesion');
    if (!boton) return;

    boton.addEventListener('click', (evento) => {
        evento.preventDefault();
        cerrarSesionSimulado();
        window.location.reload();
    });
}

// ==========================================================
// MENÚ MÓVIL — única fuente de verdad para abrir/cerrar
// ==========================================================
function inicializarMenuMovil() {
    const btnAbrir = document.getElementById('btnMenuMovil');
    const btnCerrar = document.getElementById('btnCerrarMenuMovil'); // puede no existir, se maneja abajo
    const nav = document.querySelector('.clienteGeneral');
    const overlay = document.getElementById('overlayMenuMovil'); // puede no existir

    if (!btnAbrir || !nav) {
        console.warn('Menú móvil: falta #btnMenuMovil o .clienteGeneral en el HTML.');
        return;
    }

    function abrirMenu() {
        nav.classList.add('menu-abierto');
        overlay?.classList.add('visible');
        document.body.classList.add('menu-bloqueado');
        btnAbrir.innerHTML = '✕';
    }

    function cerrarMenu() {
        nav.classList.remove('menu-abierto');
        overlay?.classList.remove('visible');
        document.body.classList.remove('menu-bloqueado');
        btnAbrir.innerHTML = '☰';
    }

    // Un solo listener en el botón — decide abrir o cerrar según el estado actual
    btnAbrir.addEventListener('click', () => {
        const estaAbierto = nav.classList.contains('menu-abierto');
        estaAbierto ? cerrarMenu() : abrirMenu();
    });

    btnCerrar?.addEventListener('click', cerrarMenu);
    overlay?.addEventListener('click', cerrarMenu);
    document.addEventListener('DOMContentLoaded', () => {
    const rol = localStorage.getItem('usuarioRol');
    const itemCliente = document.querySelector('.item-cliente');
    const itemDecorador = document.querySelector('.item-decorador');

    if (rol === 'decorador') {
        if (itemCliente) itemCliente.style.display = 'none'; // Oculta Mis Eventos
        if (itemDecorador) itemDecorador.style.display = 'block'; // Muestra Administrador
    } else if (rol === 'cliente') {
        if (itemCliente) itemCliente.style.display = 'block';
        if (itemDecorador) itemDecorador.style.display = 'none';
    }
});
}