const HORA_INICIO_CALENDARIO = 0;   
const HORA_FIN_CALENDARIO = 25;     
const PIXELES_POR_HORA = 60;
const NOMBRES_DIAS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
const NOMBRES_MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

let inicioSemanaActual = obtenerInicioDeSemana(new Date());
let listaEventosSemana = [];
let modoEdicionAgenda = false;
let idEventoSeleccionadoAgenda = null;

document.addEventListener('DOMContentLoaded', async () => {
    dibujarEstructuraCalendario();
    inicializarNavegacion();
    inicializarModalAgenda();
    await cargarYPintarSemana();
});

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

function inicializarNavegacion() {
    document.getElementById('botonSemanaAnterior').addEventListener('click', async () => {
        inicioSemanaActual.setDate(inicioSemanaActual.getDate() - 7);
        await cargarYPintarSemana();
    });

    document.getElementById('botonSemanaSiguiente').addEventListener('click', async () => {
        inicioSemanaActual.setDate(inicioSemanaActual.getDate() + 7);
        await cargarYPintarSemana();
    });
}

async function cargarYPintarSemana() {
    const finSemana = new Date(inicioSemanaActual);
    finSemana.setDate(finSemana.getDate() + 6);

    pintarEncabezadoDias(inicioSemanaActual);
    pintarEtiquetaMes(inicioSemanaActual, finSemana);

    try {
        listaEventosSemana = await obtenerEventosPorSemana(
            formatearFechaISO(inicioSemanaActual),
            formatearFechaISO(finSemana)
        );
        pintarEventos(listaEventosSemana, inicioSemanaActual);
    } catch (error) {
        console.error('Error al cargar la agenda:', error);
    }
}

function pintarEtiquetaMes(inicio, fin) {
    const etiqueta = document.getElementById('etiquetaMesAgenda');
    const mismoMes = inicio.getMonth() === fin.getMonth();
    etiqueta.textContent = mismoMes
        ? `${NOMBRES_MESES[inicio.getMonth()]} ${inicio.getFullYear()}`
        : `${NOMBRES_MESES[inicio.getMonth()]} - ${NOMBRES_MESES[fin.getMonth()]} ${fin.getFullYear()}`;
}

function pintarEncabezadoDias(inicioSemana) {
    const contenedor = document.getElementById('encabezadoDiasAgenda');
    const hoy = formatearFechaISO(new Date());

    let html = '<div class="celda-esquina"></div>';
    for (let i = 0; i < 7; i++) {
        const dia = new Date(inicioSemana);
        dia.setDate(dia.getDate() + i);
        const esHoy = formatearFechaISO(dia) === hoy;

        html += `
            <div class="celda-dia-header">
                <span class="nombre-dia">${NOMBRES_DIAS[dia.getDay()]}</span>
                <span class="numero-dia ${esHoy ? 'dia-actual' : ''}">${dia.getDate()}</span>
            </div>
        `;
    }
    contenedor.innerHTML = html;
}

function dibujarEstructuraCalendario() {
    const columnaHoras = document.getElementById('columnaHorasAgenda');
    const columnasDias = document.getElementById('columnasDiasAgenda');

    const totalHoras = HORA_FIN_CALENDARIO - HORA_INICIO_CALENDARIO;
    const alturaTotal = totalHoras * PIXELES_POR_HORA;

    let htmlHoras = '';
    for (let h = HORA_INICIO_CALENDARIO; h < HORA_FIN_CALENDARIO; h++) {
        htmlHoras += `<div class="etiqueta-hora">${String(h).padStart(2, '0')}:00</div>`;
    }
    columnaHoras.innerHTML = htmlHoras;
    columnaHoras.style.height = `${alturaTotal}px`;

    let htmlColumnas = '';
    for (let i = 0; i < 7; i++) {
        htmlColumnas += `<div class="columna-dia" data-dia-indice="${i}" style="height:${alturaTotal}px;"></div>`;
    }
    columnasDias.innerHTML = htmlColumnas;
    columnasDias.style.height = `${alturaTotal}px`;
}

function pintarEventos(eventos, inicioSemana) {
    document.querySelectorAll('.evento-agenda').forEach(el => el.remove());

    // 1. Clasificamos y filtramos los eventos visibles en esta semana
    const eventosVisibles = eventos.map(evento => {
        const fechaEvento = new Date(evento.fecha + 'T00:00:00');
        const diferenciaDias = Math.round((fechaEvento - inicioSemana) / (1000 * 60 * 60 * 24));
        return { ...evento, diferenciaDias };
    }).filter(e => e.diferenciaDias >= 0 && e.diferenciaDias <= 6);

    // 2. Agrupamos los eventos que caen en el MISMO agujero (mismo día y misma hora)
    const grupos = {};
    eventosVisibles.forEach(evento => {
        const clave = `${evento.diferenciaDias}-${evento.horaInicio}`;
        if (!grupos[clave]) grupos[clave] = [];
        grupos[clave].push(evento);
    });

    // 3. Dibujamos los bloques
    for (const clave in grupos) {
        const eventosGrupo = grupos[clave];
        const primerEvento = eventosGrupo[0];
        
        const columna = document.querySelector(`.columna-dia[data-dia-indice="${primerEvento.diferenciaDias}"]`);
        if (!columna) continue;

        const top = (primerEvento.horaInicio - HORA_INICIO_CALENDARIO) * PIXELES_POR_HORA;
        const alto = primerEvento.duracionHoras * PIXELES_POR_HORA;

        const bloque = document.createElement('div');
        bloque.className = `evento-agenda evento-${primerEvento.tipo}`;
        bloque.style.top = `${top}px`;
        bloque.style.height = `${alto}px`;
        bloque.style.cursor = 'pointer';

        if (eventosGrupo.length > 1) {
            // ==========================================
            // MODO AGRUPADO (Múltiples eventos encimados)
            // ==========================================
            const cantidadExtra = eventosGrupo.length - 1;
            bloque.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <strong>${primerEvento.titulo} + ${cantidadExtra} más</strong>
                </div>
                <small>${formatearHora(primerEvento.horaInicio)} - Eventos simultáneos</small>
            `;

            // Al darle clic al cuadro, mostramos los detalles pero advertimos que hay más
// Al darle clic al cuadro agrupado, mandamos al usuario al historial
// Al darle clic al cuadro agrupado, mandamos al usuario al historial
            bloque.addEventListener('click', (e) => {
                e.stopPropagation();
                // Redirección a tu vista general de eventos original
                window.location.href = 'Historial.html'; 
            });

        } else {
            // ==========================================
            // MODO INDIVIDUAL (Un solo evento en la hora)
            // ==========================================
            bloque.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <strong>${primerEvento.titulo}</strong>
                    <!-- El z-index y el pointer-events:none previenen que el clic se confunda -->
                    <button type="button" class="btn-edit-agenda" title="Editar Evento" style="background:none; border:none; color:inherit; cursor:pointer; padding:0 2px; position:relative; z-index:10;">
                        <i data-lucide="edit-2" style="width:13px; height:13px; pointer-events:none;"></i>
                    </button>
                </div>
                <small>${formatearHora(primerEvento.horaInicio)} - ${primerEvento.duracionHoras}h</small>
            `;

            // Clic en el cuadro general -> Solo abre Ver Detalles
            bloque.addEventListener('click', () => {
                abrirModalDetallesAgenda(primerEvento);
            });

            // Clic milimétrico en el botón de Editar -> Detiene la propagación y abre el Editor
            const btnEditar = bloque.querySelector('.btn-edit-agenda');
            btnEditar.addEventListener('click', (e) => {
                e.stopPropagation(); // Esto evita que el clic "traspase" el botón y le pegue al cuadro
                abrirModalParaEditarAgenda(primerEvento);
            });
        }

        columna.appendChild(bloque);
    }

    lucide.createIcons();
}

function formatearHora(horaDecimal) {
    const horas = Math.floor(horaDecimal);
    const minutos = Math.round((horaDecimal - horas) * 60);
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

function inicializarModalAgenda() {
    const modalForm = document.getElementById('modalNuevoEvento');
    const modalDet = document.getElementById('modalVerDetalles');
    const formulario = document.getElementById('formularioNuevoEvento');
    const tituloContenedor = modalForm.querySelector('.modal-titulo');

    document.getElementById('botonAbrirModalEvento').addEventListener('click', () => {
        modoEdicionAgenda = false;
        idEventoSeleccionadoAgenda = null;
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

    // Primero, buscamos los elementos de forma segura
        const inputSalon = document.getElementById('inputSalonEvento');
        const inputEstado = document.getElementById('inputEstadoEvento');
        const inputMateriales = document.getElementById('inputMateriales');

        const datos = {
            titulo: document.getElementById('inputNombreEvento').value,
            tipo: document.getElementById('inputTipoEvento').value,
            fecha: document.getElementById('inputFechaEvento').value,
            horaInicio: convertirHoraANumero(document.getElementById('inputHoraInicio').value),
            horaRecogerMaterial: convertirHoraANumero(document.getElementById('inputHoraRecoger').value),
            duracionHoras: 3,
            
            // Si el select existe, toma su valor; si no, pon un valor por defecto
            salon: inputSalon ? inputSalon.value : 'Por definir',
            estado: inputEstado ? inputEstado.value : 'proceso',
            materiales: inputMateriales && inputMateriales.value ? inputMateriales.value.split(',').map(m => m.trim()).filter(Boolean) : []
        };

        if (modoEdicionAgenda && idEventoSeleccionadoAgenda !== null) {
            await editarEventoAgenda(idEventoSeleccionadoAgenda, datos);
        } else {
            const extra = {
                solicitante: 'Registro Manual (Agenda)',
                imagen: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=600&q=80'
            };
            await agregarEventoAgenda({ ...datos, ...extra });
        }

        modalForm.classList.add('oculto');
        formulario.reset();
        await cargarYPintarSemana();
    });
}

function abrirModalParaEditarAgenda(evento) {
    modoEdicionAgenda = true;
    idEventoSeleccionadoAgenda = evento.id;

    const modalForm = document.getElementById('modalNuevoEvento');
    const tituloContenedor = modalForm.querySelector('.modal-titulo');
    tituloContenedor.innerHTML = '<i data-lucide="edit-2"></i><h3>EDICIÓN DE EVENTO</h3>';
    lucide.createIcons();

    document.getElementById('inputNombreEvento').value = evento.titulo;
    document.getElementById('inputTipoEvento').value = evento.tipo;
    document.getElementById('inputFechaEvento').value = evento.fecha;
    document.getElementById('inputHoraInicio').value = convertirNumeroAHoraString(evento.horaInicio);
    document.getElementById('inputHoraRecoger').value = convertirNumeroAHoraString(evento.horaRecogerMaterial);
    document.getElementById('inputSalonEvento').value = evento.salon || 'Por definir';
    document.getElementById('inputMateriales').value = (evento.materiales || []).join(', ');
    document.getElementById('inputEstadoEvento').value = evento.estado || 'proceso';

    modalForm.classList.remove('oculto');
}

function abrirModalDetallesAgenda(evento) {
    document.getElementById('detNombre').textContent = evento.titulo;
    document.getElementById('detTipo').textContent = evento.tipo;
    
    const [anio, mes, dia] = evento.fecha.split('-');
    document.getElementById('detFecha').textContent = `${dia}/${mes}/${anio}`;
    
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