package com.deco_one.api;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utilidad para obtener conexiones a la base de datos DECO_ONE.
 * En producción, esto se mejoraría con un ConnectionPool (HikariCP, etc),
 * pero para aprender es suficiente así.
 */
public class DatabaseConnection {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseConnection.class);
    
    // Credenciales de tu MySQL local
    private static final String URL = "jdbc:mysql://127.0.0.1:3306/DECO_ONE";
    private static final String USER = "root";
    private static final String PASSWORD = "decoone123"; // Cambia aquí si tu usuario root tiene contraseña
    
    static {
        // Carga el driver de MySQL (opcional en versiones modernas, pero es buena práctica)
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            logger.info("✓ Driver MySQL cargado correctamente");
        } catch (ClassNotFoundException e) {
            logger.error("✗ No se pudo cargar el driver MySQL", e);
            throw new RuntimeException("Driver MySQL no disponible", e);
        }
    }
    
    /**
     * Obtiene una conexión a la base de datos.
     * IMPORTANTE: El llamador DEBE cerrar la conexión cuando termine.
     */
    public static Connection getConnection() throws SQLException {
        try {
            Connection conn = DriverManager.getConnection(URL, USER, PASSWORD);
            logger.debug("✓ Conexión a DECO_ONE establecida");
            return conn;
        } catch (SQLException e) {
            logger.error("✗ Error al conectar a la BD: " + e.getMessage(), e);
            throw e;
        }
    }
}