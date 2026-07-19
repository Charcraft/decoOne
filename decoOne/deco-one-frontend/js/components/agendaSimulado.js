const CLAVE_ALMACENAMIENTO_AGENDA = 'deco_one_agenda_simulada';

function fechaRelativaISO(diasDesdeHoy) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + diasDesdeHoy);
    return fecha.toISOString().split('T')[0];
}

function obtenerEventosAgendaGuardados() {
    const datos = localStorage.getItem(CLAVE_ALMACENAMIENTO_AGENDA);
    if (datos) return JSON.parse(datos);
    const porDefecto = obtenerEventosAgendaPorDefecto();
    guardarEventosAgenda(porDefecto);
    return porDefecto;
}
function obtenerEventosAgendaPorDefecto() {
    return [
        {
            id: 1,
            titulo: "Boda de Ana y Carlos",
            tipo: "boda",
            fecha: fechaRelativaISO(2), // Se programa para dentro de 2 días
            horaInicio: 14, 
            horaRecogerMaterial: 23, 
            duracionHoras: 8,
            salon: "Salón Diamante",
            solicitante: "Ana Martínez",
            materiales: ["Sillas Tiffany", "Centros de mesa", "Arco floral"],
            estado: "proceso",
            imagen: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=600&q=80"
        },
        {
            id: 2,
            titulo: "XV Años Valeria",
            tipo: "xv",
            fecha: fechaRelativaISO(0), // Se programa para HOY
            horaInicio: 18, 
            horaRecogerMaterial: 2, 
            duracionHoras: 6,
            salon: "Jardín Los Pinos",
            solicitante: "Familia Gómez",
            materiales: ["Pista iluminada", "Letras gigantes"],
            estado: "curso",
            imagen: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80"
        }
    ];
}

function guardarEventosAgenda(lista) {
    localStorage.setItem(CLAVE_ALMACENAMIENTO_AGENDA, JSON.stringify(lista));
}

/** Usada por agenda.js (vista semanal) */
async function obtenerEventosPorSemana(desde, hasta) {
    // TODO(conexión backend): GET /api/eventos?desde=X&hasta=Y
    await simularRetraso(300);
    const todos = obtenerEventosAgendaGuardados();
    return todos.filter(evento => evento.fecha >= desde && evento.fecha <= hasta);
}

/** Usada por historial.js (vista mensual, con más detalle) */
async function obtenerEventosPorMes(anio, mes) {
    // TODO(conexión backend): GET /api/eventos?anio=X&mes=Y
    await simularRetraso(300);
    const todos = obtenerEventosAgendaGuardados();
    return todos.filter(evento => {
        const [a, m] = evento.fecha.split('-');
        return Number(a) === anio && Number(m) === mes + 1;
    });
}

/** Usada por historial.js cuando llega desde la Agenda con ?evento=ID */
async function obtenerEventoPorId(id) {
    // TODO(conexión backend): GET /api/eventos/{id}
    await simularRetraso(200);
    const todos = obtenerEventosAgendaGuardados();
    return todos.find(evento => evento.id === Number(id)) || null;
}

async function agregarEventoAgenda(nuevoEvento) {
    // TODO(conexión backend): POST /api/eventos  (body: nuevoEvento)
    await simularRetraso(300);
    const eventos = obtenerEventosAgendaGuardados();
    const nuevoId = eventos.length > 0 ? Math.max(...eventos.map(e => e.id)) + 1 : 1;
    const completo = { id: nuevoId, estado: 'proceso', ...nuevoEvento };
    eventos.push(completo);
    guardarEventosAgenda(eventos);
    return completo;
}
/** Función para editar un evento existente en el almacenamiento simulado */
async function editarEventoAgenda(id, datosActualizados) {
    // TODO(conexión backend): PATCH /api/eventos/{id}  (body: datosActualizados)
    await simularRetraso(300);
    let eventos = obtenerEventosAgendaGuardados();
    
    const indice = eventos.findIndex(e => e.id === Number(id));
    if (indice !== -1) {
        eventos[indice] = {
            ...eventos[indice],
            ...datosActualizados,
            id: Number(id), // Aseguramos mantener el ID original
            horaInicio: Number(datosActualizados.horaInicio),
            horaRecogerMaterial: Number(datosActualizados.horaRecogerMaterial)
        };
        guardarEventosAgenda(eventos);
    }
    return eventos[indice];
}

function calcularEstadoEvento(evento) {
    if (evento.estadoManual === 'curso') return { texto: 'En curso', clase: 'curso' };
    if (evento.estadoManual === 'terminado') return { texto: 'Terminado', clase: 'terminado' };
    // Faltaba este caso: sin él, un evento cancelado manualmente caía directo
    // al cálculo por fecha de abajo y podía volver a mostrarse como "En proceso"
    // o "En curso" — justo el mismo tipo de bug silencioso que ya vimos con
    // el estado 'pendiente' en el CSS de las tarjetas.
    if (evento.estadoManual === 'cancelado') return { texto: 'Cancelado', clase: 'cancelado' };

    const ahora = new Date();
    const inicio = new Date(evento.fecha + 'T00:00:00');
    inicio.setTime(inicio.getTime() + (evento.horaInicio * 60 * 60 * 1000));
    const fin = new Date(inicio.getTime() + ((evento.duracionHoras || 2) * 60 * 60 * 1000));

    if (ahora > fin) return { texto: 'Terminado', clase: 'terminado' };
    if (ahora >= inicio && ahora <= fin) return { texto: 'En curso', clase: 'curso' };
    return { texto: 'En proceso', clase: 'proceso' };
}