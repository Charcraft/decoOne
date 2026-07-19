/**
 * Este archivo centraliza todas las llamadas a la API del backend.
 * Reemplaza al antiguo "solicitudesSimulado.js".
 */

// 1. Definimos la URL base en un solo lugar.
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
        const response = await fetch(`${API_BASE_URL}/admin/solicitudes/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        
        if (!response.ok) throw new Error('Error al actualizar');
        return true;
    } catch (error) {
        console.error(error);
        return false;
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