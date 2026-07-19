function inicializarSidebar() {
    inicializarSubmenuEventos();
    marcarPaginaActiva();
    inicializarMenuMovilAdmin();
}

function inicializarSubmenuEventos() {
    const boton = document.getElementById('botonSubmenuEventos');
    const submenu = document.getElementById('submenuEventos');

    boton.addEventListener('click', () => {
        submenu.classList.toggle('abierto');
        boton.classList.toggle('desplegado');
    });
}

function marcarPaginaActiva() {
    const rutaActual = window.location.pathname;
    const items = document.querySelectorAll('.item-nav[data-ruta]');

    items.forEach(item => {
        const ruta = item.dataset.ruta;
        if (rutaActual.includes(`/${ruta}/`) || rutaActual.includes(`${ruta}.html`)) {
            item.classList.add('activo');
            const submenuPadre = item.closest('.submenu-sidebar');
            if (submenuPadre) {
                submenuPadre.classList.add('abierto');
                document.getElementById('botonSubmenuEventos').classList.add('desplegado');
            }
        }
    });
}

// ==========================================================
// MENÚ MÓVIL — botón hamburguesa del navbar abre/cierra el sidebar
// como panel deslizante. Independiente del toggle de "Eventos".
// ==========================================================
function inicializarMenuMovilAdmin() {
    const boton = document.getElementById('btnMenuMovilAdmin');
    const sidebar = document.querySelector('.sidebar-admin');

    if (!boton || !sidebar) {
        console.warn('Menú móvil admin: falta #btnMenuMovilAdmin o .sidebar-admin en el DOM.');
        return;
    }

    // El overlay se crea una sola vez por JS; no necesita vivir en sidebar.html
    // porque debe cubrir toda la pantalla independientemente de dónde se inyecte el sidebar.
    let overlay = document.getElementById('overlaySidebarAdmin');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlaySidebarAdmin';
        overlay.className = 'overlay-sidebar-admin';
        document.body.appendChild(overlay);
    }

    function abrirMenu() {
        sidebar.classList.add('sidebar-abierto');
        overlay.classList.add('visible');
        document.body.classList.add('menu-bloqueado');
        boton.innerHTML = '✕';
    }

    function cerrarMenu() {
        sidebar.classList.remove('sidebar-abierto');
        overlay.classList.remove('visible');
        document.body.classList.remove('menu-bloqueado');
        boton.innerHTML = '☰';
    }

    boton.addEventListener('click', () => {
        const estaAbierto = sidebar.classList.contains('sidebar-abierto');
        estaAbierto ? cerrarMenu() : abrirMenu();
    });

    overlay.addEventListener('click', cerrarMenu);

    // Cierra automáticamente al elegir una sección, para no dejar el panel
    // abierto tapando la página nueva después de navegar
    sidebar.querySelectorAll('.item-nav[href]').forEach(link => {
        link.addEventListener('click', cerrarMenu);
    });

    // Lo mismo para los links del perfil (Ir a Landing Page, Cerrar Sesión)
    sidebar.querySelectorAll('.sidebar-footer-movil a').forEach(link => {
        link.addEventListener('click', cerrarMenu);
    });
}