async function obtenerDatosDashboard() {
    await simularRetraso(400);

    return {
        metricas: {
            eventosEsteMes: 12,
            presupuestoPromedio: 2000,
            invitadosPromedio: 148
        },
        recomendaciones: {
            estiloSugerido: 'Vintage / Rustico',
            paletaColores: 'Oro, Crema, Verde salvia',
            florTemporada: 'Dalia, Peonia',
            tendencias: [
                'Arcos de follaje natural',
                'Iluminación cálida con velas',
                'Mesas tipo banquete largo'
            ]
        },
        demandaPorMes: [
            { mes: 'Enero', valor: 35 },
            { mes: 'Febrero', valor: 18 },
            { mes: 'Marzo', valor: 20 },
            { mes: 'Abril', valor: 10 },
            { mes: 'Mayo', valor: 90 },
            { mes: 'Junio', valor: 55 },
            { mes: 'Julio', valor: 95 },
            { mes: 'Agosto', valor: 8 },
            { mes: 'Septiembre', valor: 62 },
            { mes: 'Octubre', valor: 42 }
        ]
    };
}

const EVENTOS_PROXIMOS_POR_TIPO = {
    Boda: {
        nombre: 'Boda de Pineda',
        presupuesto: 45000,
        materialesSolicitados: [
            'Globos Blancos',
            'Globos Azul Celeste',
            'Bases de metal',
            'Mamparas media luna',
            'Telas Blancas',
            'telas Azul celeste'
        ]
    },
    Bautizo: {
        nombre: 'Bautizo de Ramirez',
        presupuesto: 18000,
        materialesSolicitados: [
            'Globos Blancos',
            'Globos Celeste pastel',
            'Mantelería blanca',
            'Arreglos florales pequeños',
            'Letrero personalizado'
        ]
    }
};

async function obtenerEventoProximoPorTipo(tipo) {
    await simularRetraso(300);
    const evento = EVENTOS_PROXIMOS_POR_TIPO[tipo];
    if (!evento) {
        throw new Error(`No hay eventos próximos registrados de tipo "${tipo}"`);
    }
    return evento;
}