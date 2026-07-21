import { obtenerMisSolicitudes } from '../components/api.js';

// ==========================================
// 1. CAPA DE DATOS (CONECTADA A MYSQL)
// ==========================================
const EventosService = {
    async obtenerEventosCliente() {
        // Leemos el correo exactamente como lo tienes en tu Local Storage
        const correo = localStorage.getItem('usuarioCorreo');

        if (!correo) {
            console.warn("No hay sesión iniciada (Falta el correo).");
            return []; 
        }

        try {
            // Enviamos el correo al backend
            const solicitudes = await obtenerMisSolicitudes(correo);
            return solicitudes.map(mapearSolicitudATarjeta);
        } catch (error) {
            console.error('Error al obtener eventos del cliente desde MySQL:', error);
            return [];
        }
    }
};

// ... a partir de aquí hacia abajo (mapearSolicitudATarjeta, UIEventos, etc.) 
// deja exactamente el mismo código que ya tenías.

function calcularEstadoPorFecha(fechaISO) {
    // Creamos la fecha de hoy ignorando la hora exacta
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Creamos la fecha del evento
    const fechaEvento = new Date(fechaISO + 'T00:00:00'); // Evita desfases de zona horaria

    if (fechaEvento > hoy) return { texto: 'En proceso', clase: 'proceso' };
    if (fechaEvento.getTime() === hoy.getTime()) return { texto: 'En curso', clase: 'curso' };
    return { texto: 'Completado', clase: 'completado' };
}

function mapearSolicitudATarjeta(solicitud) {
    const p = solicitud.presupuesto || 0;
    const a = solicitud.abono_requerido || 0;
    const s = solicitud.salon || solicitud.salonDeseado;

    // Caso 1: Rechazado
    if (solicitud.estado === 'descartado' || solicitud.estado === 'rechazado') {
        return construirTarjeta(solicitud, 'Rechazado', 'rechazado', s, '—', p, a);
    }

    // Caso 2: Pendiente
    if (solicitud.estado === 'pendiente') {
        return construirTarjeta(solicitud, 'Pendiente', 'pendiente', s, '—', p, a);
    }

    // Caso 3: Aprobado (Aquí entra la lógica automática)
    if (solicitud.estado === 'aprobado') {
        // Calculamos el estado real basado en el reloj
        const estadoAuto = calcularEstadoPorFecha(solicitud.fechaEventoDeseada);
        
        return construirTarjeta(
            solicitud, 
            estadoAuto.texto, 
            estadoAuto.clase, 
            s, 
            'Decorador Asignado',
            p,
            a
        );
    }

    // Fallback por defecto
    return construirTarjeta(solicitud, solicitud.estado, 'pendiente', s, '—', p, a);
}

function construirTarjeta(solicitud, estadoTexto, claseEstado, salon, disenador, presupuestoTotal = 0, totalAbonado = 0) {
    return {
        id: solicitud.id,
        tipo: solicitud.tipoEvento,
        titulo: `${solicitud.tipoEvento} de ${solicitud.nombre}`,
        estado: estadoTexto,
        claseEstado: claseEstado,
        // Usamos la fecha real que viene de MySQL (fechaEventoDeseada)
        fechaFormateada: formatearFechaLargaCliente(solicitud.fechaEventoDeseada || '2026-01-01'),
        salon: salon,
        disenador: disenador,
        imagenUrl: solicitud.imagenUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', // Imagen por defecto si no hay
        presupuestoTotal: presupuestoTotal,
        totalAbonado: totalAbonado
    };
}

function formatearFechaLargaCliente(fechaISO) {
    if (!fechaISO) return 'Fecha por definir';
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const partes = fechaISO.split('-');
    if (partes.length !== 3) return fechaISO; // Por si viene en otro formato
    const [anio, mes, dia] = partes;
    return `${Number(dia)} de ${meses[Number(mes) - 1]} del ${anio}`;
}

// ==========================================
// 2. CAPA DE VISTA (Renderizado, filtros, resumen y Modal)
// ==========================================
const UIEventos = {
    contenedorGrid: document.getElementById('gridEventos'),
    modal: document.getElementById('modalDetalleEvento'),
    eventosActuales: [],

    renderizarTarjetas(listaEventos) {
        this.eventosActuales = listaEventos;
        this.pintarResumen(listaEventos);
        this.pintarLista(listaEventos);
        this.inicializarFiltros();
    },

    pintarLista(lista) {
        this.contenedorGrid.innerHTML = '';

        if (lista.length === 0) {
            this.contenedorGrid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color: var(--color-texto-opaco);">No tienes eventos registrados aún. Envía tu solicitud desde la sección de Contacto.</p>';
            return;
        }

        lista.forEach(evento => {
            const eventoJSON = encodeURIComponent(JSON.stringify(evento));
            const tarjeta = `
                <article class="tarjetaEventoCliente" data-estado="${evento.claseEstado}">
                    <div class="contenedorImagenEvento">
                        <img src="${evento.imagenUrl}" alt="${evento.titulo}" class="imagenEvento">
                        <span class="estadoEvento ${evento.claseEstado}">${evento.estado}</span>
                    </div>
                    <div class="infoEvento">
                        <h3>${evento.titulo}</h3>
                        <div class="detalleEvento"><i data-lucide="calendar"></i><span>${evento.fechaFormateada}</span></div>
                        <div class="detalleEvento"><i data-lucide="map-pin"></i><span>Salon: ${evento.salon}</span></div>
                        <button class="verDetalles" data-evento="${eventoJSON}" style="background:none; border:none; cursor:pointer;">Ver detalles &rarr;</button>
                    </div>
                </article>
            `;
            this.contenedorGrid.innerHTML += tarjeta;
        });

        // Event Listeners para los botones de Ver Detalles
        document.querySelectorAll('.verDetalles').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const data = e.currentTarget.getAttribute('data-evento');
                this.abrirModal(data);
            });
        });

        if (window.lucide) lucide.createIcons();
    },

    pintarResumen(lista) {
        const completados = lista.filter(e => e.claseEstado === 'completado').length;
        const enCurso = lista.filter(e => e.claseEstado === 'curso').length;
        const proceso = lista.filter(e => e.claseEstado === 'proceso' || e.claseEstado === 'pendiente').length;

        document.getElementById('contadorCompletados').textContent = completados;
        document.getElementById('contadorProximos').textContent = enCurso;
        document.getElementById('contadorProceso').textContent = proceso;
    },

    inicializarFiltros() {
        document.querySelectorAll('.filtroEvento').forEach(boton => {
            boton.onclick = () => {
                document.querySelectorAll('.filtroEvento').forEach(b => b.classList.remove('activo'));
                boton.classList.add('activo');

                const filtro = boton.dataset.filtro;
                const filtrado = filtro === 'todos'
                    ? this.eventosActuales
                    : this.eventosActuales.filter(e => e.claseEstado === filtro);

                this.pintarLista(filtrado);
            };
        });
    },

    abrirModal(eventoCodificado) {
        const evento = JSON.parse(decodeURIComponent(eventoCodificado));

        document.getElementById('modalImgCabecera').src = evento.imagenUrl;
        document.getElementById('modalTipoEvento').innerText = evento.tipo;
        document.getElementById('modalTituloEvento').innerText = evento.titulo;

        const etiquetaEstado = document.getElementById('modalEstadoEvento');
        etiquetaEstado.innerText = evento.estado;
        etiquetaEstado.className = `estadoEvento ${evento.claseEstado}`;

        document.getElementById('modalFecha').innerText = evento.fechaFormateada;
        document.getElementById('modalUbicacion').innerText = evento.salon || 'Por definir';

        const saldoPendiente = evento.presupuestoTotal - evento.totalAbonado;
        const formatoMXN = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);

        document.getElementById('modalPresupuestoTotal').innerText = formatoMXN(evento.presupuestoTotal);
        document.getElementById('modalTotalAbonado').innerText = formatoMXN(evento.totalAbonado);
        document.getElementById('modalSaldoPendiente').innerText = formatoMXN(saldoPendiente);


        if (window.lucide) lucide.createIcons();
        this.modal.classList.remove('oculto');
    },

    cerrarModal() {
        this.modal.classList.add('oculto');
    },

    configurarCierreModal() {
        document.getElementById('btnCerrarModal')?.addEventListener('click', () => this.cerrarModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.cerrarModal();
        });
    }
};

// ==========================================
// 3. CONTROLADOR PRINCIPAL
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    UIEventos.configurarCierreModal();
    const eventos = await EventosService.obtenerEventosCliente();
    UIEventos.renderizarTarjetas(eventos);
});