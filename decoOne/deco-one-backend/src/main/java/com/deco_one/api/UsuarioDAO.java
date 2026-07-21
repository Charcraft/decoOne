package com.deco_one.api;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UsuarioDAO {
    private static final Logger logger = LoggerFactory.getLogger(UsuarioDAO.class);

    /**
     * Busca un usuario por correo y retorna su ID.
     * Si no existe, retorna -1 (no lo crea).
     */
    public static int obtenerIdPorCorreo(String correo) {
        String checkSql = "SELECT id FROM usuarios WHERE correo = ?";

        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement checkStmt = conn.prepareStatement(checkSql)) {
             
            checkStmt.setString(1, correo);
            ResultSet rs = checkStmt.executeQuery();
            
            if (rs.next()) {
                return rs.getInt("id"); // Retorna el ID si el usuario ya está registrado
            }

        } catch (Exception e) {
            logger.error("✗ Error al buscar el usuario: " + e.getMessage(), e);
        }
        return -1; // Retorna -1 si no existe o si hubo un error
    }
    /**
     * Registra un nuevo usuario en la base de datos.
     */
    public static Usuario registrarUsuario(String nombre, String correo, String contrasena) throws Exception {
        // 1. Verificamos si el correo ya existe
        if (obtenerIdPorCorreo(correo) != -1) {
            throw new Exception("El correo ya está registrado. Intenta iniciar sesión.");
        }

        // 2. Insertamos el nuevo usuario
        String sql = "INSERT INTO usuarios (nombre, correo, contrasena, rol) VALUES (?, ?, ?, 'cliente')";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql, java.sql.Statement.RETURN_GENERATED_KEYS)) {
             
            stmt.setString(1, nombre);
            stmt.setString(2, correo);
            stmt.setString(3, contrasena); // Nota: Por ahora se guarda en texto plano para pruebas
            
            stmt.executeUpdate();
            
            ResultSet rs = stmt.getGeneratedKeys();
            if (rs.next()) {
                Usuario u = new Usuario();
                u.id = rs.getInt(1);
                u.nombre = nombre;
                u.correo = correo;
                u.rol = "cliente";
                logger.info("✓ Nuevo usuario registrado: " + correo);
                return u;
            }
        } catch (Exception e) {
            logger.error("✗ Error al registrar usuario: " + e.getMessage(), e);
            throw new Exception("Error interno al crear la cuenta.");
        }
        return null;
    }

    /**
     * Valida el correo y la contraseña.
     */
    public static Usuario autenticar(String correo, String contrasena) {
        String sql = "SELECT id, nombre, correo, rol FROM usuarios WHERE correo = ? AND contrasena = ?";
        
        try (Connection conn = DatabaseConnection.getConnection();
             PreparedStatement stmt = conn.prepareStatement(sql)) {
             
            stmt.setString(1, correo);
            stmt.setString(2, contrasena);
            
            ResultSet rs = stmt.executeQuery();
            if (rs.next()) {
                Usuario u = new Usuario();
                u.id = rs.getInt("id");
                u.nombre = rs.getString("nombre");
                u.correo = rs.getString("correo");
                u.rol = rs.getString("rol");
                logger.info("✓ Usuario autenticado: " + correo);
                return u;
            }
        } catch (Exception e) {
            logger.error("✗ Error en login: " + e.getMessage(), e);
        }
        return null; // Retorna null si las credenciales son incorrectas
    }
}