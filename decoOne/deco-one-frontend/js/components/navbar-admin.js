function inicializarNavbar() {
    const nombre = localStorage.getItem('usuarioNombre') || 'Admin';
    document.getElementById('nombreAdminUI').textContent = nombre;
    document.getElementById('avatarAdminUI').textContent = nombre.charAt(0).toUpperCase();

    // Réplica del perfil dentro del sidebar — solo existe/se ve en mobile,
    // pero se puebla siempre por si el usuario cambia de tamaño de pantalla
    const nombreSidebar = document.getElementById('nombreAdminUISidebar');
    const avatarSidebar = document.getElementById('avatarAdminUISidebar');
    if (nombreSidebar) nombreSidebar.textContent = nombre;
    if (avatarSidebar) avatarSidebar.textContent = nombre.charAt(0).toUpperCase();

    const trigger = document.getElementById('perfilTrigger');
    const dropdown = document.getElementById('dropdownPerfil');

    trigger.addEventListener('click', (evento) => {
        evento.stopPropagation();
        dropdown.classList.toggle('abierto');
    });

    document.addEventListener('click', (evento) => {
        if (!dropdown.contains(evento.target) && !trigger.contains(evento.target)) {
            dropdown.classList.remove('abierto');
        }
    });

    const botonCerrar = document.getElementById('botonCerrarSesion');
    botonCerrar.addEventListener('click', (evento) => {
        evento.preventDefault();
        cerrarSesionSimulado(); // definida en js/core/localStorage.js
        window.location.href = '../../index.html';
    });

    // Mismo botón, versión dentro del sidebar móvil
    const botonCerrarSidebar = document.getElementById('botonCerrarSesionSidebar');
    if (botonCerrarSidebar) {
        botonCerrarSidebar.addEventListener('click', (evento) => {
            evento.preventDefault();
            cerrarSesionSimulado();
            window.location.href = '../../index.html';
        });
    }
}