package com.deco_one.api;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.sql.PreparedStatement;

/**
 * DAO para la tabla 'solicitudes'.
 * Se encarga de leer/escribir solicitudes en la BD.
 */
public class SolicitudDAO {
    private static final Logger logger = LoggerFactory.getLogger(SolicitudDAO.class);

    /**
     * Obtiene TODAS las solicitudes de la BD.
     */
    public static List<Solicitud> obtenerTodas() {
        List<Solicitud> solicitudes = new ArrayList<>();
        String sql = "SELECT id, id_usuario, nombre, tipo_evento, fecha_evento_deseada, " +
                     "salon_deseado, ideas, telefono, imagen, estado, fecha_solicitud " +
                     "FROM solicitudes";

        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                Solicitud sol = new Solicitud();
                sol.setId(rs.getInt("id"));
                sol.setIdUsuario(rs.getInt("id_usuario"));
                sol.setNombre(rs.getString("nombre"));
                sol.setTipoEvento(rs.getString("tipo_evento"));
                
                java.sql.Date sqlDate = rs.getDate("fecha_evento_deseada");
                if (sqlDate != null) sol.setFechaEventoDeseada(sqlDate.toLocalDate());
                
                sol.setSalonDeseado(rs.getString("salon_deseado"));
                sol.setIdeas(rs.getString("ideas"));
                sol.setTelefono(rs.getString("telefono"));
                sol.setImagen(rs.getString("imagen"));
                sol.setEstado(rs.getString("estado"));
                
                Timestamp ts = rs.getTimestamp("fecha_solicitud");
                if (ts != null) sol.setFechaSolicitud(ts.toLocalDateTime());
                
                solicitudes.add(sol);
            }
            logger.info("✓ Se obtuvieron " + solicitudes.size() + " solicitudes de la BD");
            return solicitudes;

        } catch (Exception e) {
            logger.error("✗ Error al obtener solicitudes: " + e.getMessage(), e);
            return new ArrayList<>(); 
        }
    }

    /**
     * Obtiene las solicitudes filtradas por Año y Mes.
     */
    public static List<Solicitud> obtenerPorMes(int anio, int mes) {
        List<Solicitud> solicitudes = new ArrayList<>();
        int mesSql = mes + 1; 
        
        String sql = "SELECT id, id_usuario, nombre, tipo_evento, fecha_evento_deseada, " +
                     "salon_deseado, ideas, telefono, imagen, estado, fecha_solicitud " +
                     "FROM solicitudes " +
                     "WHERE YEAR(fecha_evento_deseada) = " + anio + " AND MONTH(fecha_evento_deseada) = " + mesSql;

        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            while (rs.next()) {
                Solicitud sol = new Solicitud();
                sol.setId(rs.getInt("id"));
                sol.setIdUsuario(rs.getInt("id_usuario"));
                sol.setNombre(rs.getString("nombre"));
                sol.setTipoEvento(rs.getString("tipo_evento"));
                
                java.sql.Date sqlDate = rs.getDate("fecha_evento_deseada");
                if (sqlDate != null) sol.setFechaEventoDeseada(sqlDate.toLocalDate());
                
                sol.setSalonDeseado(rs.getString("salon_deseado"));
                sol.setIdeas(rs.getString("ideas"));
                sol.setTelefono(rs.getString("telefono"));
                sol.setImagen(rs.getString("imagen"));
                sol.setEstado(rs.getString("estado"));
                
                Timestamp ts = rs.getTimestamp("fecha_solicitud");
                if (ts != null) sol.setFechaSolicitud(ts.toLocalDateTime());
                
                solicitudes.add(sol);
            }
            logger.info("✓ Se obtuvieron " + solicitudes.size() + " solicitudes para " + mesSql + "/" + anio);
            return solicitudes;

        } catch (Exception e) {
            logger.error("✗ Error al obtener solicitudes por mes: " + e.getMessage(), e);
            return new ArrayList<>();
        }
    }

    /**
     * Obtiene una solicitud por su ID.
     */
    public static Solicitud obtenerPorId(int id) {
        String sql = "SELECT id, id_usuario, nombre, tipo_evento, fecha_evento_deseada, " +
                     "salon_deseado, ideas, telefono, imagen, estado, fecha_solicitud " +
                     "FROM solicitudes WHERE id = " + id;

        try (Connection conn = DatabaseConnection.getConnection();
             Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery(sql)) {

            if (rs.next()) {
                Solicitud sol = new Solicitud();
                sol.setId(rs.getInt("id"));
                sol.setIdUsuario(rs.getInt("id_usuario"));
                sol.setNombre(rs.getString("nombre"));
                sol.setTipoEvento(rs.getString("tipo_evento"));
                
                java.sql.Date sqlDate = rs.getDate("fecha_evento_deseada");
                if (sqlDate != null) sol.setFechaEventoDeseada(sqlDate.toLocalDate());
                
                sol.setSalonDeseado(rs.getString("salon_deseado"));
                sol.setIdeas(rs.getString("ideas"));
                sol.setTelefono(rs.getString("telefono"));
                sol.setImagen(rs.getString("imagen"));
                sol.setEstado(rs.getString("estado"));
                
                Timestamp ts = rs.getTimestamp("fecha_solicitud");
                if (ts != null) sol.setFechaSolicitud(ts.toLocalDateTime());
                
                logger.info("✓ Solicitud con ID " + id + " obtenida");
                return sol;
            }
            logger.warn("⚠ No se encontró solicitud con ID " + id);
            return null;

        } catch (Exception e) {
            logger.error("✗ Error al obtener solicitud por ID: " + e.getMessage(), e);
            return null;
        }
    }
    
    /**
     * Inserta una nueva solicitud en la base de datos.
     */
    public static boolean insertar(Solicitud sol) {
        String sql = "INSERT INTO solicitudes (id_usuario, nombre, tipo_evento, fecha_evento_deseada, salon_deseado, ideas, telefono, estado) " +
                     "VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente')";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setInt(1, sol.getIdUsuario());
            stmt.setString(2, sol.getNombre());
            stmt.setString(3, sol.getTipoEvento());
            // Convertimos LocalDate de Java al Date de SQL
            stmt.setDate(4, java.sql.Date.valueOf(sol.getFechaEventoDeseada())); 
            stmt.setString(5, sol.getSalonDeseado());
            stmt.setString(6, sol.getIdeas());
            stmt.setString(7, sol.getTelefono());

            int filasAfectadas = stmt.executeUpdate();
            logger.info("✓ Nueva solicitud guardada en la BD.");
            return filasAfectadas > 0;

        } catch (Exception e) {
            logger.error("✗ Error al insertar la solicitud: " + e.getMessage(), e);
            return false;
        }
    }

    /**
     * Obtiene las solicitudes de un usuario específico.
     */
    public static List<Solicitud> obtenerPorUsuario(int idUsuario) {
        List<Solicitud> lista = new ArrayList<>();
        String sql = "SELECT * FROM solicitudes WHERE id_usuario = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
            
            stmt.setInt(1, idUsuario);
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    Solicitud s = new Solicitud();
                    s.setId(rs.getInt("id"));
                    s.setIdUsuario(rs.getInt("id_usuario"));
                    s.setNombre(rs.getString("nombre"));
                    s.setTipoEvento(rs.getString("tipo_evento"));
                    s.setSalonDeseado(rs.getString("salon_deseado"));
                    s.setIdeas(rs.getString("ideas"));
                    s.setEstado(rs.getString("estado"));

                    try { s.setFechaEventoDeseada(rs.getDate("fecha_evento_deseada").toLocalDate()); } 
                    catch (Exception e) { s.setFechaEventoDeseada(java.time.LocalDate.now()); }

                    lista.add(s);
                }
            }
        } catch (Exception e) {
            System.out.println("Error al obtener solicitudes del usuario: " + e.getMessage());
        }
        return lista;
    }
    /**
     * Actualiza el estado de una solicitud (ej. de 'pendiente' a 'aprobado' o 'rechazado')
     */
    public static boolean actualizarEstado(int id, String nuevoEstado) {
        String sql = "UPDATE solicitudes SET estado = ? WHERE id = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {

            stmt.setString(1, nuevoEstado);
            stmt.setInt(2, id);

            int filasAfectadas = stmt.executeUpdate();
            logger.info("✓ Estado de solicitud " + id + " actualizado a: " + nuevoEstado);
            return filasAfectadas > 0;

        } catch (Exception e) {
            logger.error("✗ Error al actualizar estado de la solicitud: " + e.getMessage(), e);
            return false;
        }
    }
} // <-- ¡Esta es la llave que faltaba para cerrar la clase correctamente!