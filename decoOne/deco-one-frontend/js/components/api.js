/**
 * Este archivo centraliza todas las llamadas a la API del backend.
 * Reemplaza al antiguo "solicitudesSimulado.js".
 */

// 1. Definimos la URL base en un solo lugar (Localhost para pruebas).
const API_BASE_URL = 'http://localhost:7000/api';
// 2. Reemplazamos las funciones simuladas por peticiones fetch reales.

export async function obtenerSolicitudesPorMes(anio, mes) {
    try {
        // Hacemos una petición HTTP GET a tu backend.
        const response = await fetch(`${API_BASE_URL}/solicitudes?anio=${anio}&mes=${mes}`);

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        // Convertimos el JSON que recibió en un objeto JavaScript.
        const solicitudes = await response.json();
        return solicitudes;

    } catch (error) {
        // Maneja errores (red caída, servidor apagado, etc).
        console.error('Error al obtener solicitudes:', error);
        return [];
    }
}

export async function actualizarEstadoSolicitud(id, nuevoEstado) {
    try {
        // 1. Cambiamos la URL para que coincida con la ruta de Main.java
        // 2. Cambiamos el método de PATCH a PUT
        const response = await fetch(`${API_BASE_URL}/solicitudes/${id}/estado`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            // Enviamos el estado tal como lo espera el Java (un mapa con la llave "estado")
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response.ok) throw new Error('Error al actualizar la solicitud en el servidor');

        return await response.text();
    } catch (error) {
        console.error("Error en actualizarEstadoSolicitud:", error);
        throw error;
    }
}

export async function crearSolicitudDesdeContacto(datos) {
    try {
        const response = await fetch(`${API_BASE_URL}/solicitudes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }

        return await response.text(); // Javalin devuelve un texto plano ("Solicitud creada exitosamente")
    } catch (error) {
        console.error('Error al enviar la solicitud al servidor:', error);
        throw error; // Lanzamos el error para que faq.js lo atrape y muestre el alert
    }
}
export async function registrarUsuarioAPI(nombre, correo, contrasena) {
    const response = await fetch(`${API_BASE_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo, contrasena })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al registrar');
    return data;
}

export async function loginUsuarioAPI(correo, contrasena) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');
    return data;
}
export async function obtenerSolicitudesAPI(anio, mes) {
    try {
        // Si el frontend pasa año y mes, filtramos; si no, trae todas por defecto
        const url = (anio !== undefined && mes !== undefined)
            ? `${API_BASE_URL}/solicitudes?anio=${anio}&mes=${mes}`
            : `${API_BASE_URL}/solicitudes`;

        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return await response.json(); // Devuelve la lista de solicitudes de MySQL
    } catch (error) {
        console.error('Error al traer solicitudes de la API:', error);
        throw error;
    }
}
export async function obtenerTodasLasSolicitudes() {
    try {
        const response = await fetch(`${API_BASE_URL}/solicitudes`);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        return await response.json(); // Devuelve absolutamente todo lo que hay en la tabla
    } catch (error) {
        console.error('Error al obtener el historial de solicitudes:', error);
        throw error;
    }
}
export async function obtenerMisSolicitudes(correo) {
    try {
        // Codificamos el correo (por los arrobas y caracteres especiales)
        const correoCodificado = encodeURIComponent(correo);

        // Ahora apuntamos a la ruta exacta del backend: /api/usuarios/correo/{correo}/solicitudes
        const response = await fetch(`${API_BASE_URL}/usuarios/correo/${correoCodificado}/solicitudes`);

        if (response.status === 404) {
            console.warn("Usuario no encontrado o sin eventos registrados.");
            return []; // Retorna vacio, no lanza un error rojo en consola
        }

        if (!response.ok) throw new Error(`Error del servidor HTTP: ${response.status}`);

        return await response.json();
    } catch (error) {
        console.error("Fallo la conexión al intentar obtener mis eventos:", error);
        return [];
    }
}
// --- Agregar al final de api.js ---

export async function crearEvento(datosEvento) {
    try {
        const response = await fetch(`${API_BASE_URL}/eventos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datosEvento)
        });
        if (!response.ok) throw new Error('Error al crear el evento en BD');
        return await response.text();
    } catch (error) {
        console.error("Error en crearEvento:", error);
        throw error;
    }
}

export async function obtenerEventos() {
    try {
        const response = await fetch(`${API_BASE_URL}/eventos`);
        if (!response.ok) throw new Error('Error al obtener la agenda');
        return await response.json();
    } catch (error) {
        console.error("Error al obtener eventos:", error);
        return [];
    }
}
// ==================== INVENTARIO Y MATERIALES ====================

// Trae todo el catálogo disponible
export const obtenerInventario = async () => {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/inventario`);
        if (!respuesta.ok) throw new Error('Error al obtener el inventario');
        return await respuesta.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

// Trae los materiales que ya están asignados a un evento
export const obtenerMaterialesDeEvento = async (idEvento) => {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/eventos/${idEvento}/materiales`);
        if (!respuesta.ok) throw new Error('Error al obtener materiales del evento');
        return await respuesta.json();
    } catch (error) {
        console.error(error);
        return [];
    }
};

// Guarda los materiales seleccionados en el evento
export const guardarMaterialesDeEvento = async (idEvento, listaMateriales) => {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/eventos/${idEvento}/materiales`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(listaMateriales)
        });
        if (!respuesta.ok) throw new Error('Error al guardar los materiales');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};
// Agrega un nuevo elemento al inventario
export const agregarElementoInventario = async (datos) => {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/inventario`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        if (!respuesta.ok) throw new Error('Error al agregar');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

// Edita un elemento del inventario
export const editarElementoInventario = async (id, datos) => {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/inventario/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
        if (!respuesta.ok) throw new Error('Error al editar');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

// Elimina (o resta) un elemento del inventario
export const eliminarElementoInventario = async (id, cantidad = null) => {
    try {
        // Si mandan cantidad, la pasamos por la URL para que Java la reste
        const url = cantidad ? `${API_BASE_URL}/inventario/${id}?cantidad=${cantidad}` : `${API_BASE_URL}/inventario/${id}`;

        const respuesta = await fetch(url, {
            method: 'DELETE'
        });
        if (!respuesta.ok) throw new Error('Error al eliminar');

        // Retornamos el inventario actualizado (para que la tabla se recargue)
        return await obtenerInventario();
    } catch (error) {
        console.error(error);
        return [];
    }
};
// ==========================================
// RUTAS DE EVENTOS / AGENDA
// ==========================================

// 2. Funciones de peticiones fetch reales.

export async function agregarEventoAgenda(datosEvento) {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/eventos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosEvento)
        });
        if (!respuesta.ok) throw new Error('Error al guardar el evento en la BD');
        return await respuesta.text();
    } catch (error) {
        console.error("Error agregando evento:", error);
        throw error;
    }
}

export async function editarEventoAgenda(id, datosEvento) {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/eventos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosEvento)
        });
        if (!respuesta.ok) throw new Error('Error al actualizar el evento en la BD');
        return await respuesta.text();
    } catch (error) {
        console.error("Error editando evento:", error);
        throw error;
    }
}