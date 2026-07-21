import { obtenerEventos } from '../components/api.js';

const SERVER_URL = 'http://localhost:7000';

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
        // Obtenemos todos los eventos reales de MySQL
        const todosLosEventos = await obtenerEventos();
        
        // Adaptamos los nombres de las variables de MySQL a lo que espera tu calendario
        listaEventosSemana = todosLosEventos.map(e => ({
            id: e.id,
            titulo: e.titulo,
            tipo: e.tipo_evento,
            fecha: e.fecha_evento,
            horaInicio: e.hora_inicio || 12,
            duracionHoras: e.duracion_horas || 3,
            salon: e.salon,
            presupuesto: e.presupuesto || 0,
            abono_requerido: e.abono_requerido || 0,
            tamano_evento: e.tamano_evento || 'Pequeño',
            solicitante: e.nombre_solicitante || 'Cliente Manual',
            mensaje_cliente: e.mensaje_cliente || 'Sin mensaje adicional'
        }));

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
        // BLINDAJE: Limpiamos la fecha por si Java le agrega horas o letras extra
        let fechaLimpia = evento.fecha || "";
        if (fechaLimpia.includes(' ')) fechaLimpia = fechaLimpia.split(' ')[0];
        if (fechaLimpia.includes('T')) fechaLimpia = fechaLimpia.split('T')[0];
        
        const fechaEvento = new Date(fechaLimpia + 'T00:00:00');
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

        // Validamos que la hora inicial sea un número válido, si no, por defecto a las 12:00
        const horaReal = parseFloat(primerEvento.horaInicio) || 12;
        const duracionReal = parseFloat(primerEvento.duracionHoras) || 3;

        const top = (horaReal - HORA_INICIO_CALENDARIO) * PIXELES_POR_HORA;
        const alto = duracionReal * PIXELES_POR_HORA;

        const bloque = document.createElement('div');
        bloque.className = `evento-agenda evento-${primerEvento.tipo}`;
        bloque.style.top = `${top}px`;
        bloque.style.height = `${alto}px`;
        bloque.style.cursor = 'pointer';

        if (eventosGrupo.length > 1) {
            const cantidadExtra = eventosGrupo.length - 1;
            bloque.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <strong>${primerEvento.titulo} + ${cantidadExtra} más</strong>
                </div>
                <small>${formatearHora(horaReal)} - Eventos simultáneos</small>
            `;

            bloque.addEventListener('click', (e) => {
                e.stopPropagation();
                window.location.href = 'Historial.html'; 
            });

        } else {
            bloque.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <strong>${primerEvento.titulo}</strong>
                    <button type="button" class="btn-edit-agenda" title="Editar Evento" style="background:none; border:none; color:inherit; cursor:pointer; padding:0 2px; position:relative; z-index:10;">
                        <i data-lucide="edit-2" style="width:13px; height:13px; pointer-events:none;"></i>
                    </button>
                </div>
                <small>${formatearHora(horaReal)} - ${duracionReal}h</small>
            `;

            bloque.addEventListener('click', () => {
                abrirModalDetallesAgenda(primerEvento);
            });

            const btnEditar = bloque.querySelector('.btn-edit-agenda');
            btnEditar.addEventListener('click', (e) => {
                e.stopPropagation(); 
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

        // Sanitización robusta
        const sanitizarFecha = (f) => {
            if (f.includes('/')) {
                const p = f.split('/');
                return p.length === 3 ? `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}` : f;
            }
            return f;
        };
        const sanitizarHora = (h) => {
            if (!h) return "00:00:00";
            let hl = h.toLowerCase().replace(/[^0-9:ampm]/g, '');
            if (hl.includes('am') || hl.includes('pm')) {
                let isPM = hl.includes('pm');
                hl = hl.replace(/am|pm/g, '');
                let p = hl.split(':');
                let hr = parseInt(p[0]) || 0;
                let mn = p[1] ? p[1].substring(0, 2) : '00';
                if (isPM && hr < 12) hr += 12;
                if (!isPM && hr === 12) hr = 0;
                return `${hr.toString().padStart(2, '0')}:${mn}:00`;
            }
            let p = h.split(':');
            return `${(p[0] || '00').padStart(2, '0')}:${(p[1] || '00').padStart(2, '0')}:00`;
        };

        const datos = {
            titulo: document.getElementById('inputNombreEvento').value,
            tipo: document.getElementById('inputTipoEvento').value,
            fecha: sanitizarFecha(document.getElementById('inputFechaEvento').value),
            horaInicio: sanitizarHora(document.getElementById('inputHoraInicio').value),
            horaRecogerMaterial: sanitizarHora(document.getElementById('inputHoraRecoger').value),
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

    // Función auxiliar para llenar inputs de forma SEGURA
    const llenarInputSeguro = (id, valor) => {
        const input = document.getElementById(id);
        if (input) input.value = valor;
    };

    // Llenamos los datos sin riesgo de que explote si falta algún input en el HTML
    llenarInputSeguro('inputNombreEvento', evento.titulo);
    llenarInputSeguro('inputTipoEvento', evento.tipo);
    llenarInputSeguro('inputFechaEvento', evento.fecha);
    
    // Validamos que horaInicio sea número antes de convertir
    const horaIn = parseFloat(evento.horaInicio) || 12;
    llenarInputSeguro('inputHoraInicio', convertirNumeroAHoraString(horaIn));
    
    // Si tiene hora de recoger, la ponemos, si no, lo dejamos en blanco
    if (evento.horaRecogerMaterial) {
        llenarInputSeguro('inputHoraRecoger', convertirNumeroAHoraString(evento.horaRecogerMaterial));
    }
    
    llenarInputSeguro('inputSalonEvento', evento.salon || 'Por definir');
    llenarInputSeguro('inputMateriales', (evento.materiales || []).join(', '));
    llenarInputSeguro('inputEstadoEvento', evento.estado || 'proceso');

    modalForm.classList.remove('oculto');
}

function abrirModalDetallesAgenda(evento) {
    const setTextoSeguro = (id, texto) => {
        const el = document.getElementById(id);
        if (el) el.textContent = texto;
    };
    const setHTMLSeguro = (id, html) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    };
    const formatearMoneda = (v) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

    setTextoSeguro('detNombre', evento.titulo);
    setTextoSeguro('detTipo', evento.tipo);
    
    let fechaLimpia = evento.fecha || "";
    if (fechaLimpia.includes(' ')) fechaLimpia = fechaLimpia.split(' ')[0];
    if (fechaLimpia.includes('T')) fechaLimpia = fechaLimpia.split('T')[0];
    
    if (fechaLimpia) {
        const [anio, mes, dia] = fechaLimpia.split('-');
        setTextoSeguro('detFecha', `${dia}/${mes}/${anio}`);
    }
    
    const horaIn = parseFloat(evento.horaInicio) || 12;
    setTextoSeguro('detHoraInicio', convertirNumeroAHoraString(horaIn) + " hrs");
    
    const horaRecoger = horaIn + (parseFloat(evento.duracionHoras) || 3);
    setTextoSeguro('detHoraRecoger', convertirNumeroAHoraString(horaRecoger) + " hrs");

    setTextoSeguro('detSalon', evento.salon || 'Por definir');
    setTextoSeguro('detSolicitante', evento.solicitante || '—');
    setTextoSeguro('detPresupuesto', formatearMoneda(evento.presupuesto || 0));
    setTextoSeguro('detAbono', formatearMoneda(evento.abono_requerido || 0));
    
    let claseTamano = 'pequeno';
    if (evento.tamano_evento === 'Mediano') claseTamano = 'mediano';
    if (evento.tamano_evento === 'Grande') claseTamano = 'grande';
    setHTMLSeguro('detTamano', `<span class="badge-estado badge-${claseTamano}">${evento.tamano_evento || 'Pequeño'}</span>`);

    setTextoSeguro('detMensajeCliente', evento.mensaje_cliente || 'Sin mensaje adicional');

    // Fetch materiales reales del evento
    setTextoSeguro('detMateriales', 'Cargando materiales...');
    fetch(`${SERVER_URL}/api/eventos/${evento.id}/materiales`)
        .then(res => res.json())
        .then(materiales => {
            const contMateriales = document.getElementById('detMateriales');
            if (materiales && materiales.length > 0) {
                contMateriales.innerHTML = materiales.map(m => `• ${m.cantidad}x ${m.nombre}`).join('<br>');
            } else {
                contMateriales.innerHTML = 'Ningún material asignado.';
            }
        })
        .catch(err => {
            console.error('Error cargando materiales', err);
            setTextoSeguro('detMateriales', 'Error al cargar materiales.');
        });

    const modalDet = document.getElementById('modalVerDetalles');
    if (modalDet) modalDet.classList.remove('oculto');

    const inputEstado = document.getElementById('inputEstadoEvento');
    if (inputEstado) inputEstado.value = evento.estado || 'proceso';
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