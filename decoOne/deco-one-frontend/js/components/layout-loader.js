document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Como todas las páginas admin son hermanas en pages/admin/,
        // navbar.html y sidebar.html siempre están en la misma carpeta
        // que la página que los carga. No hace falta calcular niveles.
        const [navRes, sideRes] = await Promise.all([
            fetch('navbar.html'),
            fetch('sidebar.html')
        ]);

        if (!navRes.ok || !sideRes.ok) {
            throw new Error(`Fallo al cargar layout. Navbar: ${navRes.status}, Sidebar: ${sideRes.status}`);
        }

        document.getElementById('navbar-placeholder').innerHTML = await navRes.text();
        document.getElementById('sidebar-placeholder').innerHTML = await sideRes.text();

        lucide.createIcons();

        if (typeof inicializarNavbar === 'function') inicializarNavbar();
        if (typeof inicializarSidebar === 'function') inicializarSidebar();
    } catch (error) {
        console.error('Error cargando el layout del panel admin:', error);
    }
});