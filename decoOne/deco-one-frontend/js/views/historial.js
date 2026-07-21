import { obtenerEventos, obtenerInventario, agregarEventoAgenda, editarEventoAgenda } from '../components/api.js';

const SERVER_URL = 'http://localhost:7000';

// Arreglo completado y cerrado correctamente
const NOMBRES_MESES_HISTORIAL = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

let fechaMesActual = new Date();
let modoEdicion = false;
let idEventoSeleccionado = null;
let modoFiltroActual = 'defecto'; // Controla el selector
let inventarioDisponible = [];
let materialesAsignadosTemporales = [];

document.addEventListener('DOMContentLoaded', async () => {
    await cargarInventarioEnSelect();
    await cargarSalonesEnSelect();
    inicializarNavegacionYFiltros();
    inicializarControladorModales();
    inicializarLogicaMateriales();
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
        // ¡Adiós a los datos simulados! Traemos los reales de MySQL
        const eventosMySQL = await obtenerEventos();

        // Adaptamos los nombres para que tu historial los entienda
        const todosLosEventos = eventosMySQL.map(e => {
            let fechaLimpia = e.fecha_evento || "";
            if (fechaLimpia.includes(' ')) fechaLimpia = fechaLimpia.split(' ')[0];

            return {
                id: e.id,
                titulo: e.titulo,
                tipo: e.tipo_evento,
                fecha: fechaLimpia,
                horaInicio: e.hora_inicio || 12,
                horaRecogerMaterial: (e.hora_inicio || 12) + (e.duracion_horas || 3),
                salon: e.salon,
                estado: e.estado || 'proceso',
                presupuesto: e.presupuesto || 0,
                abono_requerido: e.abono_requerido || 0,
                tamano_evento: e.tamano_evento || 'Pequeño',
                solicitante: e.nombre_solicitante || e.solicitante || 'Cliente Manual',
                mensaje_cliente: e.mensaje_cliente || 'Sin mensaje adicional',
                imagen: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500' // Imagen por defecto
            };
        });

        let eventosFiltrados = [];
        const hoy = new Date();
        const strHoy = formatearFechaISO(hoy);

        if (modoFiltroActual === 'defecto') {
            const anio = fechaMesActual.getFullYear();
            const mes = fechaMesActual.getMonth();
            document.getElementById('etiquetaMesHistorial').textContent = `${NOMBRES_MESES_HISTORIAL[mes]} ${anio}`;

            // Filtramos manualmente por mes y año
            eventosFiltrados = todosLosEventos.filter(e => {
                if (!e.fecha) return false;
                const [a, m] = e.fecha.split('-');
                return Number(a) === anio && Number(m) === mes + 1;
            });

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
                if (!e.fecha) return false;
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

        materialesAsignadosTemporales = []; // <-- LIMPIAR ARRAY
        pintarTablaMaterialesDinamicos();   // <-- VACIAR TABLA VISUAL

        lucide.createIcons();
        formulario.reset();
        modalForm.classList.remove('oculto');
    });

    document.getElementById('botonCerrarModal').addEventListener('click', () => modalForm.classList.add('oculto'));
    document.getElementById('botonCancelarModal').addEventListener('click', () => modalForm.classList.add('oculto'));
    document.getElementById('botonCerrarDetalles').addEventListener('click', () => modalDet.classList.add('oculto'));
    document.getElementById('botonCerrarDetallesAceptar').addEventListener('click', () => modalDet.classList.add('oculto'));

    document.getElementById('inputPresupuesto').addEventListener('input', calcularAbonoYTamano);

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Sanitización robusta
        const sanitizarFecha = (f) => {
            if (f.includes('/')) {
                const p = f.split('/');
                return p.length === 3 ? `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}` : f;
            }
            return f;
        };
        const sanitizarHora = (h) => {
            if (!h) return 0.0;
            let hl = h.toLowerCase().replace(/[^0-9:ampm]/g, '');
            let isPM = hl.includes('pm');
            hl = hl.replace(/am|pm/g, '');
            let p = hl.split(':');
            let hr = parseInt(p[0]) || 0;
            let mn = parseInt(p[1]) || 0;
            if (isPM && hr < 12) hr += 12;
            if (!isPM && hr === 12) hr = 0;
            return Number((hr + (mn / 60.0)).toFixed(2));
        };

        const datos = {
            titulo: document.getElementById('inputNombreEvento').value,
            tipo: document.getElementById('inputTipoEvento').value,
            fecha: sanitizarFecha(document.getElementById('inputFechaEvento').value),
            horaInicio: sanitizarHora(document.getElementById('inputHoraInicio').value),
            horaRecogerMaterial: sanitizarHora(document.getElementById('inputHoraRecoger').value),
            duracionHoras: 3,
            salon: document.getElementById('inputSalonEvento').value,
            estadoManual: document.getElementById('inputEstadoManual') ? document.getElementById('inputEstadoManual').value : 'auto',
            presupuesto: Number(document.getElementById('inputPresupuesto').value.replace(/[^0-9.-]+/g, "")) || 0,
            abono_requerido: Number(document.getElementById('inputAbonoRequerido').value.replace(/[^0-9.-]+/g, "")) || 0,
            tamano_evento: document.getElementById('inputTamanoEvento').value || 'Pequeño',
            // NUEVO: Transforma la tabla en un arreglo de objetos para la base de datos
            materiales: materialesAsignadosTemporales.map(m => ({
                id_articulo: m.id_articulo,
                cantidad: m.cantidad
            }))
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

    document.getElementById('inputPresupuesto').value = evento.presupuesto || '';

    // Convertimos los materiales desde el backend al formato de la tablita
    materialesAsignadosTemporales = [];
    pintarTablaMaterialesDinamicos(); // Renderiza vacío primero

    fetch(`${SERVER_URL}/api/eventos/${evento.id}/materiales`)
        .then(res => res.json())
        .then(materiales => {
            if (materiales && materiales.length > 0) {
                materialesAsignadosTemporales = materiales.map(m => ({
                    id_articulo: m.id_articulo,
                    nombre: m.nombre,
                    cantidad: m.cantidad
                }));
                pintarTablaMaterialesDinamicos();
            }
        })
        .catch(console.error);

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

    document.getElementById('detPresupuesto').textContent = formatearMoneda(evento.presupuesto || 0);
    document.getElementById('detAbono').textContent = formatearMoneda(evento.abono_requerido || 0);

    let claseTamano = 'pequeno';
    if (evento.tamano_evento === 'Mediano') claseTamano = 'mediano';
    if (evento.tamano_evento === 'Grande') claseTamano = 'grande';
    document.getElementById('detTamano').innerHTML = `<span class="badge-estado badge-${claseTamano}">${evento.tamano_evento || 'Pequeño'}</span>`;

    document.getElementById('detMateriales').textContent = 'Cargando materiales...';

    // FETCH MATERIALES REALES DEL EVENTO
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
            document.getElementById('detMateriales').textContent = 'Error al cargar materiales.';
        });

    document.getElementById('detMensajeCliente').textContent = evento.mensaje_cliente || 'Sin mensaje adicional';

    document.getElementById('modalVerDetalles').classList.remove('oculto');
    // Blindaje del estado
    const inputEstado = document.getElementById('inputEstadoEvento');
    if (inputEstado) inputEstado.value = evento.estado || 'proceso';
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
    if (isNaN(num)) return "00:00";
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
// Función para calcular dinámicamente el estado del evento
function calcularEstadoEvento(evento) {
    // 1. Si el administrador forzó el estado manualmente, usamos ese
    if (evento.estadoManual && evento.estadoManual !== 'auto') {
        if (evento.estadoManual === 'curso') return { clase: 'curso', texto: 'En curso' };
        if (evento.estadoManual === 'terminado') return { clase: 'terminado', texto: 'Terminado' };
    }

    // 2. Si es automático, lo calculamos por las horas
    const ahora = new Date();

    // Convertimos las horas numéricas (ej. 14.5) a texto (ej. "14:30") para crear fechas válidas
    const horaInicioStr = convertirNumeroAHoraString(evento.horaInicio);
    const horaRecogerStr = convertirNumeroAHoraString(evento.horaRecogerMaterial);

    const fechaInicio = new Date(`${evento.fecha}T${horaInicioStr}`);
    const fechaFin = new Date(`${evento.fecha}T${horaRecogerStr}`);

    if (ahora < fechaInicio) {
        return { clase: 'proceso', texto: 'Pendiente' };
    } else if (ahora >= fechaInicio && ahora <= fechaFin) {
        return { clase: 'curso', texto: 'En curso' };
    } else {
        return { clase: 'terminado', texto: 'Terminado' };
    }
}
function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    const [anio, mes, dia] = fechaISO.split('-');
    return `${dia}/${mes}/${anio}`;
}
// ==========================================
// LÓGICA DEL INVENTARIO EN EL MODAL DE EVENTOS
// ==========================================

// 1. Pide a MySQL el inventario y rellena el Select
async function cargarInventarioEnSelect() {
    try {
        inventarioDisponible = await obtenerInventario();
        const select = document.getElementById('selectMaterialDinamico');

        if (!inventarioDisponible || inventarioDisponible.length === 0) {
            select.innerHTML = '<option value="">Inventario vacío o sin conexión</option>';
            return;
        }

        select.innerHTML = '<option value="" disabled selected>Elige un material...</option>' +
            inventarioDisponible.map(item => {
                // Adaptamos según el nombre de la columna en tu BD
                const nombre = item.nombre || item.tipo || 'Sin nombre';
                const stock = item.stock_total || item.cantidad || 0;
                return `<option value="${item.id}" data-stock="${stock}" data-nombre="${nombre}">${nombre} (Disponible: ${stock})</option>`;
            }).join('');

    } catch (error) {
        console.error("Error cargando inventario:", error);
        document.getElementById('selectMaterialDinamico').innerHTML = '<option value="">Error de conexión</option>';
    }
}

async function cargarSalonesEnSelect() {
    const select = document.getElementById('inputSalonEvento');
    if (select) {
        try {
            const respuesta = await fetch(`${SERVER_URL}/api/salones`);
            const salones = await respuesta.json();
            salones.forEach(salon => {
                const opcion = document.createElement('option');
                opcion.value = salon.nombre;
                opcion.textContent = salon.nombre;
                select.appendChild(opcion);
            });
        } catch (error) {
            console.error('Error cargando salones:', error);
        }
    }
}

// 2. Activa el botón de "Añadir"
function inicializarLogicaMateriales() {
    document.getElementById('btnAgregarMaterialAlEvento').addEventListener('click', () => {
        const select = document.getElementById('selectMaterialDinamico');
        const inputCant = document.getElementById('inputCantidadMaterial');
        const idArticulo = select.value;
        const cantidad = Number(inputCant.value);

        if (!idArticulo) {
            alert("Por favor selecciona un material de la lista.");
            return;
        }
        if (cantidad <= 0) {
            alert("La cantidad debe ser 1 o mayor.");
            return;
        }

        // Verificación de stock (para que no asignen más de lo que tienes)
        const opcionSeleccionada = select.options[select.selectedIndex];
        const stockDisponible = Number(opcionSeleccionada.dataset.stock);
        const nombreMaterial = opcionSeleccionada.dataset.nombre;

        if (cantidad > stockDisponible) {
            alert(`No hay suficiente stock. Solo te quedan ${stockDisponible} unidades de ${nombreMaterial}.`);
            return;
        }

        // Revisamos si ya agregaron este material a la tabla para sumar la cantidad
        const indiceExistente = materialesAsignadosTemporales.findIndex(m => Number(m.id_articulo) === Number(idArticulo));
        if (indiceExistente >= 0) {
            const nuevaCantidad = materialesAsignadosTemporales[indiceExistente].cantidad + cantidad;
            if (nuevaCantidad > stockDisponible) {
                alert(`No puedes agregar más. El límite total es ${stockDisponible}.`);
                return;
            }
            materialesAsignadosTemporales[indiceExistente].cantidad = nuevaCantidad;
        } else {
            materialesAsignadosTemporales.push({ id_articulo: Number(idArticulo), nombre: nombreMaterial, cantidad: cantidad });
        }

        inputCant.value = ''; // Limpiar el input
        pintarTablaMaterialesDinamicos(); // Actualizar la vista
    });
}

// 3. Pinta la mini-tabla del modal
function pintarTablaMaterialesDinamicos() {
    const tbody = document.getElementById('tablaMaterialesDinamicos');

    if (materialesAsignadosTemporales.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding: 1rem; color:#8fa0a8;">Sin materiales asignados</td></tr>';
        return;
    }

    tbody.innerHTML = materialesAsignadosTemporales.map((mat, index) => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
            <td style="padding: 0.6rem 1rem;">${mat.nombre}</td>
            <td style="padding: 0.6rem 1rem; text-align: center;">${mat.cantidad}</td>
            <td style="padding: 0.6rem 1rem; text-align: center;">
                <button type="button" class="btnEliminarMatTemp" data-index="${index}" title="Quitar" style="background: none; border: none; color: #ff5252; cursor: pointer; display: flex; align-items: center; justify-content: center; margin: 0 auto;">
                    <i data-lucide="x-circle" style="width: 18px; height: 18px;"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();

    // Lógica del botoncito rojo para quitar elementos de la mini-tabla
    document.querySelectorAll('.btnEliminarMatTemp').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const index = Number(e.currentTarget.dataset.index);
            materialesAsignadosTemporales.splice(index, 1);
            pintarTablaMaterialesDinamicos();
        });
    });

    calcularAbonoYTamano();
}

function calcularAbonoYTamano() {
    const presupuesto = Number(document.getElementById('inputPresupuesto').value) || 0;
    const totalUnidades = materialesAsignadosTemporales.reduce((acc, mat) => acc + mat.cantidad, 0);

    let tamano = 'Pequeño';
    let porcentaje = 0.20;

    if (totalUnidades > 40) {
        tamano = 'Grande';
        porcentaje = 0.50;
    } else if (totalUnidades >= 16) {
        tamano = 'Mediano';
        porcentaje = 0.30;
    }

    const abono = presupuesto * porcentaje;

    document.getElementById('inputTamanoEvento').value = tamano;

    const inputAbono = document.getElementById('inputAbonoRequerido');
    inputAbono.value = formatearMoneda(abono);
    inputAbono.dataset.valor = abono;
}

function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);
}
