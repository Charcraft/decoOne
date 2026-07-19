const NOMBRES_MESES_HISTORIAL = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

let fechaMesActual = new Date();
let modoEdicion = false;
let idEventoSeleccionado = null;
let modoFiltroActual = 'defecto'; // Controla el selector

document.addEventListener('DOMContentLoaded', async () => {
    inicializarNavegacionYFiltros();
    inicializarControladorModales();
    await recargarVistaHistorial();

    const parametros = new URLSearchParams(window.location.search);
    const idEvento = parametros.get('evento');
    if (idEvento) resaltarEvento(Number(idEvento));
});

// ==========================================
// NAVEGACIÓN Y FILTRADO
// ==========================================
function inicializarNavegacionYFiltros() {
    // Flechas mensuales
    document.getElementById('botonMesAnterior').addEventListener('click', async () => {
        fechaMesActual.setMonth(fechaMesActual.getMonth() - 1);
        await recargarVistaHistorial();
    });
    document.getElementById('botonMesSiguiente').addEventListener('click', async () => {
        fechaMesActual.setMonth(fechaMesActual.getMonth() + 1);
        await recargarVistaHistorial();
    });

    // Selector de filtro
    document.getElementById('filtroFechaHistorial').addEventListener('change', async (e) => {
        modoFiltroActual = e.target.value;
        const navMes = document.getElementById('contNavegacionMes');
        
        // Oculta las flechas si no estamos en el modo "Por defecto"
        if (modoFiltroActual === 'defecto') {
            navMes.style.display = 'flex';
        } else {
            navMes.style.display = 'none';
        }
        
        await recargarVistaHistorial();
    });
}

async function recargarVistaHistorial() {
    try {
        const todosLosEventos = obtenerEventosAgendaGuardados(); // Extraemos todo del localStorage simulado
        let eventosFiltrados = [];
        const hoy = new Date();
        const strHoy = formatearFechaISO(hoy);

        if (modoFiltroActual === 'defecto') {
            const anio = fechaMesActual.getFullYear();
            const mes = fechaMesActual.getMonth();
            document.getElementById('etiquetaMesHistorial').textContent = `${NOMBRES_MESES_HISTORIAL[mes]} ${anio}`;
            eventosFiltrados = await obtenerEventosPorMes(anio, mes);
            
        } else if (modoFiltroActual === 'hoy') {
            eventosFiltrados = todosLosEventos.filter(e => e.fecha === strHoy);
            
        } else if (modoFiltroActual === 'semana') {
            const inicioSemana = obtenerInicioDeSemana(hoy);
            const finSemana = new Date(inicioSemana);
            finSemana.setDate(finSemana.getDate() + 6);
            
            const strInicio = formatearFechaISO(inicioSemana);
            const strFin = formatearFechaISO(finSemana);
            
            eventosFiltrados = todosLosEventos.filter(e => e.fecha >= strInicio && e.fecha <= strFin);
            
        } else if (modoFiltroActual === 'mes') {
            const anio = hoy.getFullYear();
            const mes = hoy.getMonth();
            eventosFiltrados = todosLosEventos.filter(e => {
                const [a, m] = e.fecha.split('-');
                return Number(a) === anio && Number(m) === mes + 1;
            });
        }
        
        pintarTarjetas(eventosFiltrados);
    } catch (error) {
        console.error('Error al cargar el historial:', error);
    }
}

// ==========================================
// RENDERIZADO DE TARJETAS
// ==========================================
function pintarTarjetas(eventos) {
    const contenedor = document.getElementById('gridHistorial');

    if (eventos.length === 0) {
        contenedor.innerHTML = `<p class="mensaje-vacio-historial">No hay eventos registrados para este filtro.</p>`;
        return;
    }

    contenedor.innerHTML = eventos.map(evento => {
        const estadoCalculado = calcularEstadoEvento(evento); // <- antes usaba evento.estado directo
        return `
        <article class="tarjeta-historial-evento" data-id="${evento.id}">
            <div style="position: relative;">
                <img src="${evento.imagen}" alt="${evento.titulo}" class="imagen-historial-evento">
                <button type="button" class="btn-editar-tarjeta botonEditarEvento" data-id="${evento.id}" title="Editar Evento"
                        style="position: absolute; top: 10px; right: 10px; background: #112a31; border: 1px solid #284e59; border-radius: 50%; width: 34px; height: 34px; cursor: pointer; display: flex; align-items: center; justify-content: center; color: #46c4be;">
                    <i data-lucide="edit-2" style="width: 15px; height: 15px;"></i>
                </button>
            </div>
            <div class="info-historial-evento">
                <div class="encabezado-tarjeta-historial">
                    <h3>${evento.titulo}</h3>
                    <span class="badge-estado badge-${estadoCalculado.clase}">${estadoCalculado.texto}</span>
                </div>
                <div class="detalle-historial">
                    <i data-lucide="calendar"></i>
                    <span>${formatearFechaLarga(evento.fecha)}</span>
                </div>
                <div class="detalle-historial">
                    <i data-lucide="map-pin"></i>
                    <span>Salon: ${evento.salon || '—'}</span>
                </div>
                <div class="detalle-historial">
                    <i data-lucide="user-round"></i>
                    <span>${evento.solicitante}</span>
                </div>
                <a href="#" class="ver-detalles-historial btnVerDetalles" data-id="${evento.id}">Ver detalles &rarr;</a>
            </div>
        </article>
    `;
    }).join('');

    lucide.createIcons();
    asignarEventosDinamicosTarjetas(eventos);
}

function asignarEventosDinamicosTarjetas(eventos) {
    document.querySelectorAll('.btnVerDetalles').forEach(enlace => {
        enlace.addEventListener('click', (e) => {
            e.preventDefault();
            const id = Number(enlace.dataset.id);
            const evento = eventos.find(ev => ev.id === id);
            if (evento) abrirModalDetalles(evento);
        });
    });

    document.querySelectorAll('.botonEditarEvento').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = Number(btn.dataset.id);
            const evento = eventos.find(ev => ev.id === id);
            if (evento) abrirModalParaEditar(evento);
        });
    });
}

// ==========================================
// MODALES (AGREGAR / EDITAR / DETALLES)
// ==========================================
function inicializarControladorModales() {
    const modalForm = document.getElementById('modalNuevoEvento');
    const modalDet = document.getElementById('modalVerDetalles');
    const formulario = document.getElementById('formularioNuevoEvento');
    const tituloContenedor = modalForm.querySelector('.modal-titulo');

    document.getElementById('botonAbrirModalEvento').addEventListener('click', () => {
        modoEdicion = false;
        idEventoSeleccionado = null;
        tituloContenedor.innerHTML = '<i data-lucide="calendar-plus"></i><h3>AGREGAR EVENTO</h3>';
        lucide.createIcons();
        formulario.reset();
        modalForm.classList.remove('oculto');
    });

    document.getElementById('botonCerrarModal').addEventListener('click', () => modalForm.classList.add('oculto'));
    document.getElementById('botonCancelarModal').addEventListener('click', () => modalForm.classList.add('oculto'));
    document.getElementById('botonCerrarDetalles').addEventListener('click', () => modalDet.classList.add('oculto'));
    document.getElementById('botonCerrarDetallesAceptar').addEventListener('click', () => modalDet.classList.add('oculto'));

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();

        const datos = {
            titulo: document.getElementById('inputNombreEvento').value,
            tipo: document.getElementById('inputTipoEvento').value,
            fecha: document.getElementById('inputFechaEvento').value,
            horaInicio: convertirHoraANumero(document.getElementById('inputHoraInicio').value),
            horaRecogerMaterial: convertirHoraANumero(document.getElementById('inputHoraRecoger').value),
            duracionHoras: 3,
            salon: document.getElementById('inputSalonEvento').value,
            estadoManual: document.getElementById('inputEstadoManual') ? document.getElementById('inputEstadoManual').value : 'auto',
            materiales: document.getElementById('inputMateriales').value.split(',').map(m => m.trim()).filter(Boolean)
        };

        if (modoEdicion && idEventoSeleccionado !== null) {
            await editarEventoAgenda(idEventoSeleccionado, datos);
        } else {
            const extraData = {
                solicitante: 'Registro Manual (Decorador)',
                imagen: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=600&q=80'
            };
            await agregarEventoAgenda({ ...datos, ...extraData });
        }

        modalForm.classList.add('oculto');
        formulario.reset();
        await recargarVistaHistorial(); // Actualiza respetando el filtro
    });
}

function abrirModalParaEditar(evento) {
    modoEdicion = true;
    idEventoSeleccionado = evento.id;

    const modalForm = document.getElementById('modalNuevoEvento');
    const tituloContenedor = modalForm.querySelector('.modal-titulo');
    tituloContenedor.innerHTML = '<i data-lucide="edit-2"></i><h3>EDICIÓN DE EVENTO</h3>';
    if (window.lucide) lucide.createIcons();

    document.getElementById('inputNombreEvento').value = evento.titulo;
    document.getElementById('inputTipoEvento').value = evento.tipo;
    document.getElementById('inputFechaEvento').value = evento.fecha;
    document.getElementById('inputHoraInicio').value = convertirNumeroAHoraString(evento.horaInicio);
    document.getElementById('inputHoraRecoger').value = convertirNumeroAHoraString(evento.horaRecogerMaterial);
    
    const inputSalon = document.getElementById('inputSalonEvento');
    if (inputSalon) inputSalon.value = evento.salon || 'Por definir';
    
    const inputMateriales = document.getElementById('inputMateriales');
    if (inputMateriales) inputMateriales.value = (evento.materiales || []).join(', ');

    // LA SOLUCIÓN: Verificamos que el select exista antes de inyectarle el dato
    const inputEstado = document.getElementById('inputEstadoEvento');
    if (inputEstado) {
        inputEstado.value = evento.estado || 'proceso';
    }

    modalForm.classList.remove('oculto');
}

function abrirModalDetalles(evento) {
    document.getElementById('detNombre').textContent = evento.titulo;
    document.getElementById('detTipo').textContent = evento.tipo;
    document.getElementById('detFecha').textContent = formatearFechaLarga(evento.fecha);
    document.getElementById('detHoraInicio').textContent = convertirNumeroAHoraString(evento.horaInicio) + " hrs";
    document.getElementById('detHoraRecoger').textContent = convertirNumeroAHoraString(evento.horaRecogerMaterial) + " hrs";
    document.getElementById('detSalon').textContent = evento.salon || 'Por definir';
    document.getElementById('detSolicitante').textContent = evento.solicitante;
    document.getElementById('detMateriales').textContent = (evento.materiales && evento.materiales.length > 0) 
        ? evento.materiales.map(m => `• ${m}`).join('\n') 
        : 'Ningún material asignado.';

    document.getElementById('modalVerDetalles').classList.remove('oculto');
    document.getElementById('inputEstadoEvento').value = evento.estado || 'proceso';
}

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================
function textoEstado(estado) {
    const textos = { proceso: 'En proceso', curso: 'En curso', terminado: 'Terminado' };
    return textos[estado] || estado;
}

function formatearFechaLarga(fechaISO) {
    const [anio, mes, dia] = fechaISO.split('-');
    return `${dia} de ${NOMBRES_MESES_HISTORIAL[Number(mes) - 1].toLowerCase()} del ${anio}`;
}

function convertirHoraANumero(valorTime) {
    if (!valorTime) return 0;
    const [h, m] = valorTime.split(':').map(Number);
    return h + (m / 60);
}

function convertirNumeroAHoraString(num) {
    const h = Math.floor(num);
    const m = Math.round((num - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function obtenerInicioDeSemana(fecha) {
    const copia = new Date(fecha);
    const diaSemana = copia.getDay(); 
    copia.setDate(copia.getDate() - diaSemana);
    copia.setHours(0, 0, 0, 0);
    return copia;
}

function formatearFechaISO(fecha) {
    return fecha.toISOString().split('T')[0];
}

function resaltarEvento(id) {
    const tarjeta = document.querySelector(`.tarjeta-historial-evento[data-id="${id}"]`);
    if (tarjeta) {
        tarjeta.classList.add('resaltado');
        tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}
