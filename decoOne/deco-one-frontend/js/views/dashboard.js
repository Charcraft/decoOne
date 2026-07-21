// ==========================================
// DASHBOARD.JS — Centro de Mando DECO-ONE
// ==========================================

const SERVER_URL = 'http://localhost:7000'; // IP devuelta a localhost para pruebas locales


let myChart = null;
let graficaActual = 'demanda';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await cargarEstadisticas();
        await cargarProximosEventos();
        await cargarPredicciones();
        await cargarGrafica('demanda');

        // Tab listeners
        document.getElementById('btnGraficaDemanda')?.addEventListener('click', () => {
            activarTab('btnGraficaDemanda');
            cargarGrafica('demanda');
        });
        document.getElementById('btnGraficaIngresos')?.addEventListener('click', () => {
            activarTab('btnGraficaIngresos');
            cargarGrafica('ingresos');
        });

    } catch (error) {
        console.error('Error al cargar el dashboard:', error);
    }
});

// ==========================================
// TABS — Intercambio visual
// ==========================================
function activarTab(idActivo) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('activo'));
    document.getElementById(idActivo)?.classList.add('activo');
}

// ==========================================
// METRICAS SUPERIORES
// ==========================================
async function cargarEstadisticas() {
    const respuesta = await fetch(`${SERVER_URL}/api/dashboard/stats`);
    const metricas = await respuesta.json();

    document.getElementById('metricaIngresos').textContent = `$ ${metricas.total_ingresos.toLocaleString('es-MX')} MXN`;
    document.getElementById('metricaEventosActivos').textContent = metricas.eventos_activos;
    document.getElementById('metricaSolicitudes').textContent = metricas.solicitudes_pendientes;
    document.getElementById('metricaMateriales').textContent = metricas.materiales_en_uso;

    // Badge en sidebar
    const badge = document.getElementById('badgeSolicitudesSidebar');
    if (badge) {
        if (metricas.solicitudes_pendientes > 0) {
            badge.textContent = metricas.solicitudes_pendientes;
            badge.style.display = 'inline-block';
        } else {
            badge.style.display = 'none';
        }
    }
}

// ==========================================
// TABLA DE PROXIMOS EVENTOS
// ==========================================
async function cargarProximosEventos() {
    const respuesta = await fetch(`${SERVER_URL}/api/dashboard/proximos-eventos`);
    const eventos = await respuesta.json();
    const tbody = document.getElementById('tablaProximosEventos');

    if (eventos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:15px; color:#8fa0a8;">No hay proximos eventos programados.</td></tr>';
        return;
    }

    tbody.innerHTML = eventos.map(evento => {
        const fechaFormat = evento.fecha_evento ? new Date(evento.fecha_evento).toLocaleDateString('es-MX') : 'Por definir';
        return `
            <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
                <td style="padding: 10px;">${fechaFormat}</td>
                <td style="padding: 10px;">${evento.titulo}</td>
                <td style="padding: 10px;">${evento.salon || 'Por definir'}</td>
                <td style="padding: 10px;">${evento.nombre_solicitante}</td>
                <td style="padding: 10px;">${evento.cantidad_materiales} piezas</td>
                <td style="padding: 10px; color: #2dd4bf; font-weight: 600;">$${evento.presupuesto.toLocaleString('es-MX')}</td>
            </tr>
        `;
    }).join('');
}

// ==========================================
// PREDICCIONES (Gemini o Fallback)
// ==========================================
async function cargarPredicciones() {
    try {
        const response = await fetch(`${SERVER_URL}/api/dashboard/predicciones`);
        if (!response.ok) {
            throw new Error(`Error en servidor (${response.status})`);
        }
        const data = await response.json();
        
        // Renderizar (fallback para soportar tanto los IDs viejos como los nuevos si el HTML no se ha actualizado aun)
        const elementEstiloPaleta = document.getElementById('txtEstiloPaleta');
        if (elementEstiloPaleta) {
            elementEstiloPaleta.innerText = `${data.estilo_sugerido}\n(${data.paleta_colores})`;
        } else {
            // IDs originales por si la vista todavia los usa
            document.getElementById('predEstilo').textContent = data.estilo_sugerido || 'Sin datos';
            document.getElementById('predPaleta').textContent = data.paleta_colores || 'Sin datos';
        }
        
        const containerTendencias = document.getElementById('listTendencias') || document.getElementById('predTendencias');
        if (containerTendencias) {
            containerTendencias.innerHTML = data.tendencias.map(t => `<li>• ${t}</li>`).join('');
        }
        
        const elementStock = document.getElementById('txtRecomendacionStock') || document.getElementById('predInventario');
        if (elementStock) {
            elementStock.innerText = data.recomendacion_inventario;
        }
    } catch (error) {
        console.warn('Cargando analitica por defecto:', error);
    }
}

// ==========================================
// GRAFICAS CON CHART.JS
// ==========================================
const TOOLTIP_CONFIG = {
    backgroundColor: 'rgba(10, 20, 28, 0.95)',
    titleColor: '#fff',
    bodyColor: '#d1d5db',
    borderColor: 'rgba(45, 212, 191, 0.3)',
    borderWidth: 1,
    cornerRadius: 6,
    padding: 10,
    titleFont: { size: 13, weight: '600' },
    bodyFont: { size: 12 }
};

const GRID_CONFIG = {
    color: 'rgba(255, 255, 255, 0.05)',
    drawBorder: false
};

async function cargarGrafica(tipo) {
    if (myChart) myChart.destroy();
    const canvas = document.getElementById('canvasGraficaDashboard');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const desc = document.getElementById('descripcionGrafica');

    if (tipo === 'demanda') {
        const res = await fetch(`${SERVER_URL}/api/dashboard/grafica-demanda-tematica`);
        const data = await res.json();
        const labels = data.map(d => d.mes);

        myChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Bodas',
                        data: data.map(d => d.bodas),
                        backgroundColor: '#2dd4bf',
                        borderRadius: 3
                    },
                    {
                        label: 'XV Anios',
                        data: data.map(d => d.xv_anios),
                        backgroundColor: '#38bdf8',
                        borderRadius: 3
                    },
                    {
                        label: 'Infantiles',
                        data: data.map(d => d.infantiles),
                        backgroundColor: '#f59e0b',
                        borderRadius: 3
                    },
                    {
                        label: 'Otros',
                        data: data.map(d => d.otros),
                        backgroundColor: '#a855f7',
                        borderRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { stepSize: 1, color: '#8fa0a8', font: { size: 11 } },
                        grid: GRID_CONFIG
                    },
                    x: {
                        ticks: { color: '#8fa0a8', font: { size: 11 } },
                        grid: GRID_CONFIG
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#ccc', usePointStyle: true, pointStyle: 'rectRounded', padding: 16 }
                    },
                    tooltip: TOOLTIP_CONFIG
                }
            }
        });

        if (desc) desc.textContent = 'Visualizacion de volumen de reservas clasificadas por tipo de evento a lo largo del anio. Permite identificar las temporadas de mayor demanda para planificar la preparacion de la utileria y paquetes decorativos.';

    } else {
        const res = await fetch(`${SERVER_URL}/api/dashboard/grafica-ingresos`);
        const data = await res.json();
        const labels = data.map(d => d.mes);
        const ingresos = data.map(d => d.total_ingresos);

        // Gradiente para el area fill
        const gradient = ctx.createLinearGradient(0, 0, 0, 320);
        gradient.addColorStop(0, 'rgba(45, 212, 191, 0.25)');
        gradient.addColorStop(1, 'rgba(45, 212, 191, 0.01)');

        myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Ingresos Brutos',
                    data: ingresos,
                    borderColor: '#2dd4bf',
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#2dd4bf',
                    pointBorderColor: '#0f1e26',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 2.5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#8fa0a8',
                            font: { size: 11 },
                            callback: function(value) {
                                return '$' + value.toLocaleString('es-MX');
                            }
                        },
                        grid: GRID_CONFIG
                    },
                    x: {
                        ticks: { color: '#8fa0a8', font: { size: 11 } },
                        grid: GRID_CONFIG
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#ccc', usePointStyle: true, pointStyle: 'circle', padding: 16 }
                    },
                    tooltip: {
                        ...TOOLTIP_CONFIG,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });

        if (desc) desc.textContent = 'Proyeccion financiera de ingresos brutos acumulados mensualmente. Facilita el analisis de liquidez y el comportamiento del flujo de caja del negocio.';
    }

    graficaActual = tipo;
}