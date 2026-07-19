const CLAVE_ALMACENAMIENTO_INVENTARIO = 'deco_one_inventario_simulado';

function obtenerInventarioPorDefecto() {
    return [
        { id: 1, fecha: '2026-06-04', referencia: '00402', tipo: 'Sillones', cantidad: 30, enUso: 18 },
        { id: 2, fecha: '2026-06-05', referencia: '00703', tipo: 'Mesa', cantidad: 23, enUso: 10 },
        { id: 3, fecha: '2026-06-05', referencia: '04302', tipo: 'Bases de metal', cantidad: 27, enUso: 27 },
        { id: 4, fecha: '2026-06-05', referencia: '05632', tipo: 'Mamparas de "rejas"', cantidad: 24, enUso: 0 },
        { id: 5, fecha: '2026-07-05', referencia: '05746', tipo: 'Bases Media Luna', cantidad: 32, enUso: 12 },
        { id: 6, fecha: '2026-09-22', referencia: '05676', tipo: 'Bases de cemento', cantidad: 21, enUso: 5 },
        { id: 7, fecha: '2026-11-08', referencia: '02476', tipo: 'Luces 50 mts.', cantidad: 17, enUso: 17 }
    ];
}

function obtenerInventarioGuardado() {
    const datos = localStorage.getItem(CLAVE_ALMACENAMIENTO_INVENTARIO);
    if (datos) {
        return JSON.parse(datos);
    }
    const inventarioPorDefecto = obtenerInventarioPorDefecto();
    guardarInventario(inventarioPorDefecto);
    return inventarioPorDefecto;
}

function guardarInventario(lista) {
    localStorage.setItem(CLAVE_ALMACENAMIENTO_INVENTARIO, JSON.stringify(lista));
}

async function obtenerInventario() {
    await simularRetraso(300); // definida en js/core/localStorage.js
    return obtenerInventarioGuardado();
}

// Nueva función que soporta eliminación parcial o total
async function eliminarElementoInventario(id, cantidadAEliminar = null) {
    await simularRetraso(300);
    let inventario = obtenerInventarioGuardado();

    if (cantidadAEliminar && cantidadAEliminar > 0) {
        // Reducimos la cantidad del elemento seleccionado
        inventario = inventario.map(item => {
            if (item.id === id) {
                const nuevaCantidad = Math.max(0, item.cantidad - cantidadAEliminar);
                // Si la cantidad llega a 0, se puede eliminar por completo o dejarlo en 0.
                // En este caso, si la cantidad llega a 0, reducimos también el uso para que no supere la cantidad.
                const nuevoEnUso = Math.min(item.enUso, nuevaCantidad);
                return { ...item, cantidad: nuevaCantidad, enUso: nuevoEnUso };
            }
            return item;
        }).filter(item => item.cantidad > 0); // Opcional: Elimina el renglón si la cantidad total llega a 0
    } else {
        // Si se deja vacío, eliminación total e irreversible
        inventario = inventario.filter(item => item.id !== id);
    }

    guardarInventario(inventario);
    return inventario;
}

async function agregarElementoInventario(nuevoElemento) {
    await simularRetraso(300);
    const inventario = obtenerInventarioGuardado();
    const nuevoId = inventario.length > 0 ? Math.max(...inventario.map(i => i.id)) + 1 : 1;
    
    const elementoCompleto = { 
        id: nuevoId, 
        ...nuevoElemento,
        cantidad: Number(nuevoElemento.cantidad),
        enUso: Number(nuevoElemento.enUso)
    };
    
    inventario.push(elementoCompleto);
    guardarInventario(inventario);
    return elementoCompleto;
}

// Función para guardar los cambios de un elemento editado
async function editarElementoInventario(id, datosActualizados) {
    await simularRetraso(300); // Simulamos la carga
    let inventario = obtenerInventarioGuardado();
    
    // Buscamos el elemento y lo actualizamos
    const indice = inventario.findIndex(item => item.id === id);
    if (indice !== -1) {
        inventario[indice] = {
            ...inventario[indice], // Mantenemos el ID original
            ...datosActualizados,  // Sobrescribimos con los nuevos datos
            cantidad: Number(datosActualizados.cantidad),
            enUso: Number(datosActualizados.enUso)
        };
        guardarInventario(inventario);
    }
    return inventario;
}