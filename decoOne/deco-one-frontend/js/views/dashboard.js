document.addEventListener('DOMContentLoaded', async () => {
    try {
        const datos = await obtenerDatosDashboard();
        pintarMetricas(datos.metricas);
        pintarRecomendaciones(datos.recomendaciones);
        pintarGraficoDemanda(datos.demandaPorMes);

        await cargarEventoPorTipo('Boda');
        inicializarSelectorTipoEvento();
    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
    }
});

function inicializarSelectorTipoEvento() {
    const selector = document.getElementById('selectorTipoEvento');
    selector.addEventListener('change', async () => {
        try {
            await cargarEventoPorTipo(selector.value);
        } catch (error) {
            console.error('Error al cambiar el tipo de evento:', error);
        }
    });
}

async function cargarEventoPorTipo(tipo) {
    const evento = await obtenerEventoProximoPorTipo(tipo);
    pintarEventoActual(evento);
}

function pintarMetricas(metricas) {
    document.getElementById('metricaEventos').textContent = metricas.eventosEsteMes;
    document.getElementById('metricaPresupuesto').textContent =
        `$ ${metricas.presupuestoPromedio.toLocaleString('es-MX')} MXN`;
    document.getElementById('metricaInvitados').textContent = metricas.invitadosPromedio;
}

function pintarEventoActual(evento) {
    document.getElementById('inputNombreEvento').value = evento.nombre;
    document.getElementById('inputPresupuesto').value =
        `$ ${evento.presupuesto.toLocaleString('es-MX')}`;

    const contenedorMateriales = document.getElementById('listaMateriales');
    contenedorMateriales.innerHTML = evento.materialesSolicitados
        .map(material => `<p>${material}</p>`)
        .join('');
}

function pintarRecomendaciones(recomendaciones) {
    document.getElementById('cajaEstiloSugerido').textContent =
        `Estilo sugerido : ${recomendaciones.estiloSugerido}`;
    document.getElementById('cajaPaletaColores').textContent =
        `Paleta de colores : ${recomendaciones.paletaColores}`;

    const lista = document.getElementById('listaTendencias');
    lista.innerHTML = recomendaciones.tendencias
        .map(tendencia => `<li>${tendencia}</li>`)
        .join('');
}

function pintarGraficoDemanda(demanda) {
    const contenedor = document.getElementById('graficoDemanda');
    const valorMaximo = Math.max(...demanda.map(d => d.valor));

    contenedor.innerHTML = demanda
        .map(({ mes, valor }) => {
            const alturaPorcentaje = (valor / valorMaximo) * 100;
            const esElMasAlto = valor === valorMaximo;
            return `
                <div class="barra-mes">
                    <span class="barra ${esElMasAlto ? 'activa' : ''}" style="--altura: ${alturaPorcentaje}%;"></span>
                    <small>${mes}</small>
                </div>
            `;
        })
        .join('');
}