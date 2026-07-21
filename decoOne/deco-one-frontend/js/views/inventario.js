import { obtenerInventario, agregarElementoInventario, editarElementoInventario, eliminarElementoInventario } from '../components/api.js';
let inventarioActual = [];
let idSeleccionadoParaEliminar = null;
let idSeleccionadoParaEditar = null; 
let modoEdicion = false; 

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await recargarYPintarTabla(); // Llamamos a la función maestra
        inicializarBuscador();
        inicializarModales();
    } catch (error) {
        console.error('Error al cargar el inventario:', error);
    }
});

// FUNCIÓN MAESTRA QUE TRADUCE Y PINTA
async function recargarYPintarTabla() {
    const datosMySQL = await obtenerInventario();
    inventarioActual = datosMySQL.map(itemDB => ({
        id: itemDB.id,
        fecha: new Date().toISOString().split('T')[0],
        referencia: itemDB.categoria || 'N/A',
        tipo: itemDB.nombre,
        cantidad: itemDB.stock_total,
        enUso: 0 // Lo calcularemos en la siguiente fase
    }));
    pintarTabla(inventarioActual);
    pintarResumen(inventarioActual);
}

// Función creadora de notificaciones
function mostrarNotificacion(mensaje, tipo = 'exito') {
    const contenedor = document.getElementById('contenedorNotificaciones');
    if (!contenedor) return;

    const notificacion = document.createElement('div');
    notificacion.className = `notificacion ${tipo}`;
    
    const icono = tipo === 'exito' ? 'check-circle' : 'alert-circle';
    
    notificacion.innerHTML = `
        <i data-lucide="${icono}"></i>
        <span>${mensaje}</span>
    `;

    contenedor.appendChild(notificacion);
    lucide.createIcons();

    // Eliminar automáticamente después de 3.5 segundos
    setTimeout(() => {
        notificacion.classList.add('desaparecer');
        notificacion.addEventListener('animationend', () => {
            notificacion.remove();
        });
    }, 3500);
}

function pintarTabla(lista) {
    const cuerpo = document.getElementById('cuerpoTablaInventario');

    if (lista.length === 0) {
        cuerpo.innerHTML = `<tr><td colspan="6" class="fila-vacia">No se encontraron elementos.</td></tr>`;
        return;
    }

    cuerpo.innerHTML = lista.map(item => {
        const porcentaje = item.cantidad > 0 ? Math.round((item.enUso / item.cantidad) * 100) : 0;
        const sinStock = porcentaje >= 100;

        return `
            <tr data-id="${item.id}">
                <td>${formatearFecha(item.fecha)}</td>
                <td>${item.referencia}</td>
                <td>
                    ${item.tipo}
                    ${sinStock ? '<span class="badge-alerta">sin stock</span>' : ''}
                </td>
                <td>${item.cantidad}</td>
                <td>
                    <span class="barra-contenedor">
                        <span class="barra-progreso ${sinStock ? 'barra-alerta' : 'barra-ok'}" style="width: ${porcentaje}%; display:block;"></span>
                    </span>
                    ${item.enUso}
                </td>
                <td class="acciones-tabla">
                    <button type="button" class="botonEditar" data-id="${item.id}" title="Editar">
                        <i data-lucide="edit-2"></i>
                    </button>
                    <button type="button" class="botonEliminar" data-id="${item.id}" title="Eliminar">
                        <i data-lucide="trash-2"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
    inicializarBotonesAccionesEnTabla();
}

function pintarResumen(lista) {
    document.getElementById('totalElementos').textContent = `${lista.length} Elementos Registrados`;
    const sinStock = lista.filter(item => item.cantidad > 0 && item.enUso >= item.cantidad);
    const badge = document.getElementById('totalSinStock');

    if (sinStock.length > 0) {
        badge.textContent = `${sinStock.length} sin disponibilidad`;
        badge.classList.remove('oculto');
    } else {
        badge.classList.add('oculto');
    }
}

function inicializarBuscador() {
    const input = document.getElementById('buscadorInventario');
    input.addEventListener('input', () => {
        const texto = input.value.trim().toLowerCase();
        const filtrado = inventarioActual.filter(item =>
            item.tipo.toLowerCase().includes(texto) ||
            item.referencia.toLowerCase().includes(texto) ||
            item.fecha.includes(texto)
        );
        pintarTabla(filtrado);
    });
}

function inicializarModales() {
    const modalAgregar = document.getElementById('modalAgregar');
    const modalEliminar = document.getElementById('modalEliminar');
    const tituloContenedor = modalAgregar.querySelector('.modal-titulo');

    // --- ABRIR MODAL AGREGAR ---
    document.getElementById('botonAgregar').addEventListener('click', () => {
        modoEdicion = false;
        idSeleccionadoParaEditar = null;
        
        tituloContenedor.innerHTML = '<i data-lucide="package"></i><h3>Agregar a Inventario</h3>';
        lucide.createIcons();
        
        document.getElementById('formularioAgregar').reset();
        modalAgregar.classList.remove('oculto');
    });

    const cerrarAgregar = () => {
        modalAgregar.classList.add('oculto');
        document.getElementById('formularioAgregar').reset();
    };

    document.getElementById('cerrarModalAgregar').addEventListener('click', cerrarAgregar);
    document.getElementById('cancelarAgregar').addEventListener('click', cerrarAgregar);

    // --- ENVIAR FORMULARIO (AGREGAR / EDITAR) ---
    document.getElementById('formularioAgregar').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cantidadTotal = Number(document.getElementById('addCantidad').value);

        const datosFormulario = {
            tipo: document.getElementById('addTipo').value,
            referencia: document.getElementById('addReferencia').value,
            fecha: document.getElementById('addFecha').value,
            cantidad: cantidadTotal
        };

        if (modoEdicion && idSeleccionadoParaEditar !== null) {
            await editarElementoInventario(idSeleccionadoParaEditar, datosFormulario);
            mostrarNotificacion('Elemento editado correctamente.', 'exito');
        } else {
            await agregarElementoInventario(datosFormulario);
            mostrarNotificacion('Elemento agregado exitosamente.', 'exito');
        }

        await recargarYPintarTabla();
        cerrarAgregar();
    });

    // --- ACCIONES MODAL ELIMINAR ---
    const cerrarEliminar = () => {
        modalEliminar.classList.add('oculto');
        document.getElementById('deleteCantidad').value = '';
        idSeleccionadoParaEliminar = null;
    };

    document.getElementById('cerrarModalEliminar').addEventListener('click', cerrarEliminar);
    document.getElementById('cancelarEliminar').addEventListener('click', cerrarEliminar);

    document.getElementById('confirmarEliminar').addEventListener('click', async () => {
        if (!idSeleccionadoParaEliminar) return;

        const inputCantidad = document.getElementById('deleteCantidad').value;
        const cantidadAEliminar = inputCantidad ? Number(inputCantidad) : null;
        const itemActual = inventarioActual.find(i => i.id === idSeleccionadoParaEliminar);

        // VALIDACIÓN: No eliminar más de lo que existe
        if (cantidadAEliminar !== null && cantidadAEliminar > itemActual.cantidad) {
            mostrarNotificacion(`Error: Intentas eliminar ${cantidadAEliminar} y solo hay ${itemActual.cantidad} disponibles.`, 'error');
            return; // Detiene el envío
        }

        await eliminarElementoInventario(idSeleccionadoParaEliminar, cantidadAEliminar);
        await recargarYPintarTabla();
        cerrarEliminar();
        
        if (cantidadAEliminar) {
            mostrarNotificacion(`Se restaron ${cantidadAEliminar} elementos del registro.`, 'exito');
        } else {
            mostrarNotificacion('Registro eliminado por completo.', 'exito');
        }
    });
}

function inicializarBotonesAccionesEnTabla() {
    document.querySelectorAll('.botonEliminar').forEach(boton => {
        boton.addEventListener('click', () => {
            idSeleccionadoParaEliminar = Number(boton.dataset.id);
            document.getElementById('modalEliminar').classList.remove('oculto');
        });
    });

    document.querySelectorAll('.botonEditar').forEach(boton => {
        boton.addEventListener('click', () => {
            const id = Number(boton.dataset.id);
            const item = inventarioActual.find(i => i.id === id);
            if (!item) return;

            modoEdicion = true;
            idSeleccionadoParaEditar = id;

            const modalAgregar = document.getElementById('modalAgregar');
            const tituloContenedor = modalAgregar.querySelector('.modal-titulo');
            
            tituloContenedor.innerHTML = '<i data-lucide="edit-2"></i><h3>Editor de Inventario</h3>';
            lucide.createIcons();

            document.getElementById('addTipo').value = item.tipo;
            document.getElementById('addReferencia').value = item.referencia;
            document.getElementById('addFecha').value = item.fecha;
            document.getElementById('addCantidad').value = item.cantidad;

            modalAgregar.classList.remove('oculto');
        });
    });
}

function formatearFecha(fechaISO) {
    if (!fechaISO) return '';
    const [anio, mes, dia] = fechaISO.split('-');
    return `${dia}/${mes}/${anio.slice(2)}`;
}