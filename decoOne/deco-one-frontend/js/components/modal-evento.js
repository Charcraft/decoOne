
function inicializarModalEvento(alGuardarExitoso, origen) {
    const botonAbrir = document.getElementById('botonAbrirModalEvento');
    const overlay = document.getElementById('modalNuevoEvento');
    const botonCerrar = document.getElementById('botonCerrarModal');
    const botonCancelar = document.getElementById('botonCancelarModal');
    const formulario = document.getElementById('formularioNuevoEvento');

    if (!botonAbrir || !overlay || !formulario) {
        console.error('Faltan elementos del modal en el HTML (botonAbrirModalEvento, modalNuevoEvento o formularioNuevoEvento).');
        return;
    }

    botonAbrir.addEventListener('click', () => {
        overlay.classList.remove('oculto');
    });

    botonCerrar.addEventListener('click', cerrarModal);
    botonCancelar.addEventListener('click', cerrarModal);

    overlay.addEventListener('click', (evento) => {
        if (evento.target === overlay) cerrarModal();
    });

    function cerrarModal() {
        overlay.classList.add('oculto');
        formulario.reset();
    }

    formulario.addEventListener('submit', async (evento) => {
        evento.preventDefault();

        const horaInicioRaw = document.getElementById('inputHoraInicio').value;
        const [horas, minutos] = horaInicioRaw.split(':').map(Number);
        const horaInicioNumerica = horas + (minutos / 60);

        const nuevoEvento = {
            titulo: document.getElementById('inputNombreEvento').value,
            tipo: document.getElementById('inputTipoEvento').value,
            fecha: document.getElementById('inputFechaEvento').value,
            horaInicio: horaInicioNumerica,
            horaRecogerMaterial: horaInicioNumerica - 2,
            duracionHoras: 3,
            salon: document.getElementById('inputSalonEvento').value,
            solicitante: origen,
            estado: 'proceso',
            materiales: document.getElementById('inputMateriales').value
                .split(',')
                .map(m => m.trim())
                .filter(Boolean),
            imagen: 'https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=600&q=80'
        };

        try {
            await agregarEventoAgenda(nuevoEvento); // definida en js/mock/agendaSimulado.js
            cerrarModal();
            await alGuardarExitoso();
        } catch (error) {
            console.error('Error al guardar el evento:', error);
            alert('No se pudo guardar el evento. Revisa la consola para más detalles.');
        }
    });
}