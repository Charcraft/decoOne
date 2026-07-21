// 1. AQUI AGREGAMOS "crearEvento" EN LA PRIMERA LINEA
import { obtenerTodasLasSolicitudes, actualizarEstadoSolicitud, crearEvento } from '../components/api.js';

let listaSolicitudes = []; 
let solicitudSeleccionadaId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Nativamente ocultamos las flechas de meses ya que ahora mostraremos TODO junto
    const btnAnt = document.getElementById('botonMesAnterior');
    const btnSig = document.getElementById('botonMesSiguiente');
    if (btnAnt) btnAnt.style.display = 'none';
    if (btnSig) btnSig.style.display = 'none';
    
    // Cambiamos el texto del encabezado
    document.getElementById('etiquetaMesSolicitudes').textContent = "Todas las solicitudes";

    inicializarModal();
    await cargarSolicitudes();
});

async function cargarSolicitudes() {
    try {
        // Traemos absolutamente todas las solicitudes de MySQL
        listaSolicitudes = await obtenerTodasLasSolicitudes();
        
        // Las ordenamos para que las más nuevas (ID más alto) salgan primero
        listaSolicitudes.sort((a, b) => b.id - a.id);

        pintarTarjetas(listaSolicitudes);
        pintarContadorPendientes(listaSolicitudes);
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
    }
}

function pintarContadorPendientes(solicitudes) {
    const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
    document.getElementById('totalPendientes').textContent = pendientes;
}

function pintarTarjetas(solicitudes) {
    const contenedor = document.getElementById('gridSolicitudes');

    if (solicitudes.length === 0) {
        contenedor.innerHTML = `<p class="mensaje-vacio-solicitudes">No hay solicitudes registradas en la base de datos.</p>`;
        return;
    }

    contenedor.innerHTML = solicitudes.map(s => {
        const imagenUrl = s.imagen || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500';
        
        return `
            <article class="tarjeta-solicitud ${s.estado !== 'pendiente' ? 'tarjeta-resuelta' : ''}" data-id="${s.id}">
                <img src="${imagenUrl}" alt="${s.nombre}" class="imagen-solicitud">
                <div class="info-solicitud">
                    <div class="encabezado-solicitud">
                        <h3>${s.nombre}</h3>
                        <span class="tiempo-solicitud">${textoTiempoRelativo(s.fechaSolicitud)}</span>
                    </div>
                    <p class="subtitulo-solicitud">${s.tipoEvento} | ${formatearFechaCorta(s.fechaEventoDeseada)}</p>
                    <p class="ideas-solicitud">"${s.ideas}"</p>
                </div>
            </article>
        `;
    }).join('');

    document.querySelectorAll('.tarjeta-solicitud').forEach(tarjeta => {
        tarjeta.addEventListener('click', () => abrirModal(Number(tarjeta.dataset.id)));
    });
}

function formatearFechaCorta(fechaISO) {
    if (!fechaISO) return '—';
    const fechaLimpia = fechaISO.split('T')[0];
    const [anio, mes, dia] = fechaLimpia.split('-');
    return `${dia}/${mes}/${anio}`;
}

function textoTiempoRelativo(fechaISO) {
    if (!fechaISO) return 'Reciente';
    const hoy = new Date();
    const fecha = new Date(fechaISO.includes('T') ? fechaISO : fechaISO + 'T00:00:00');
    const diffDias = Math.round((hoy - fecha) / (1000 * 60 * 60 * 24));

    if (diffDias <= 0) return 'Hoy';
    if (diffDias === 1) return 'Hace 1 día';
    return `Hace ${diffDias} días`;
}

// ==========================================================
// MODAL
// ==========================================================
function inicializarModal() {
    const overlay = document.getElementById('overlayModalSolicitud');

    document.getElementById('botonCerrarModalSolicitud').addEventListener('click', cerrarModal);
    overlay.addEventListener('click', (evento) => {
        if (evento.target === overlay) cerrarModal();
    });

    document.getElementById('botonRechazarSolicitud').addEventListener('click', () => resolverSolicitud('descartado'));
    document.getElementById('botonAprobarSolicitud').addEventListener('click', () => resolverSolicitud('contactado'));
}

function abrirModal(id) {
    // Buscamos directamente en nuestra variable global en memoria
    const solicitud = listaSolicitudes.find(s => s.id === id);
    if (!solicitud) return;

    solicitudSeleccionadaId = id;

    const imagenUrl = solicitud.imagen || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500';
    document.getElementById('imagenModalSolicitud').src = imagenUrl;
    document.getElementById('imagenModalSolicitud').alt = solicitud.nombre;
    document.getElementById('nombreModalSolicitud').textContent = solicitud.nombre;
    document.getElementById('fechaModalSolicitud').textContent = formatearFechaLarga(solicitud.fechaEventoDeseada);
    document.getElementById('salonModalSolicitud').textContent = solicitud.salonDeseado || 'Por definir';
    document.getElementById('tipoModalSolicitud').textContent = solicitud.tipoEvento;
    document.getElementById('correoModalSolicitud').textContent = solicitud.correo || 'Sin correo';
    document.getElementById('mensajeModalSolicitud').textContent = `"${solicitud.ideas}"`;

    const badge = document.getElementById('badgeEstadoModal');
    badge.textContent = textoEstadoSolicitud(solicitud.estado);
    badge.className = `badge-estado-modal badge-modal-${solicitud.estado}`;

    const botonesDisabled = solicitud.estado !== 'pendiente';
    document.getElementById('botonAprobarSolicitud').disabled = botonesDisabled;
    document.getElementById('botonRechazarSolicitud').disabled = botonesDisabled;

    document.getElementById('overlayModalSolicitud').classList.remove('oculto');
}

function cerrarModal() {
    document.getElementById('overlayModalSolicitud').classList.add('oculto');
    solicitudSeleccionadaId = null;
}

function textoEstadoSolicitud(estado) {
    const textos = { pendiente: 'Pendiente', contactado: 'Aprobada', descartado: 'Rechazada' };
    return textos[estado] || estado;
}

function formatearFechaLarga(fechaISO) {
    if (!fechaISO) return '—';
    const fechaLimpia = fechaISO.split('T')[0];
    const [anio, mes, dia] = fechaLimpia.split('-');
    
    const meses = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    return `${Number(dia)} de ${meses[Number(mes) - 1]}, ${anio}`;
}

// 2. AQUI REEMPLAZAMOS LA FUNCION PARA QUE USE LA BD REAL
async function resolverSolicitud(nuevoEstado) {
    if (!solicitudSeleccionadaId) return;

    try {
        // Actualiza el estado de la solicitud en MySQL
        await actualizarEstadoSolicitud(solicitudSeleccionadaId, nuevoEstado);

        // Si se aprobó, creamos automáticamente el evento en la agenda real
        if (nuevoEstado === 'contactado') {
            const solicitud = listaSolicitudes.find(s => s.id === solicitudSeleccionadaId);

            if (solicitud) {
                // Mandamos los datos a la API de tu servidor Java
                await crearEvento({
                    id_solicitud: solicitud.id,
                    titulo: `Evento de ${solicitud.nombre}`,
                    tipo_evento: solicitud.tipoEvento,
                    fecha_evento: solicitud.fechaEventoDeseada,
                    hora_inicio: 12.0, // Formato que usa tu calendario
                    duracion_horas: 3.0,
                    salon: solicitud.salonDeseado || 'Por definir',
                    estado: 'proceso'
                });
            }
        }

        cerrarModal();
        await cargarSolicitudes(); // Recarga la lista completa
    } catch (error) {
        console.error("Error al resolver la solicitud:", error);
    }
}