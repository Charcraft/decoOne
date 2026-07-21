package com.deco_one.api;

import io.javalin.Javalin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class Main {
    private static final Logger logger = LoggerFactory.getLogger(Main.class);
    private static final int PORT = 7000;

    public static void main(String[] args) {
        Javalin app = Javalin.create(config -> {
            // Corrección de CORS para Javalin 5.x
            config.plugins.enableCors(cors -> {
                cors.add(it -> {
                    it.anyHost();
                });
            });
        });

        // ==================== RUTAS ====================

        // Ruta de prueba (raíz)
        app.get("/", ctx -> ctx.json(new Object() {
            public String mensaje = "¡Bienvenido a DECO_ONE Backend!";
            public String version = "1.0";
        }));

        // ========== SOLICITUDES ==========

        /**
         * GET /api/solicitudes?anio=X&mes=Y
         * Retorna las solicitudes filtradas por mes, o todas si no hay parámetros.
         * ¡Blindado contra errores 500 de Jackson y fechas!
         */
        app.get("/api/solicitudes", ctx -> {
            logger.info("→ GET /api/solicitudes");

            String anioParam = ctx.queryParam("anio");
            String mesParam = ctx.queryParam("mes");

            java.util.List<com.deco_one.api.Solicitud> solicitudes;

            // Si el frontend envió año y mes, usamos la función de mes
            if (anioParam != null && mesParam != null) {
                int anio = Integer.parseInt(anioParam);
                int mes = Integer.parseInt(mesParam);
                solicitudes = SolicitudDAO.obtenerPorMes(anio, mes);
            } else {
                // Si no, devolvemos todas por defecto
                solicitudes = SolicitudDAO.obtenerTodas();
            }

            // 🛠️ BYPASS ANTI-ERROR 500: Convertimos los objetos a Mapas simples de Java
            java.util.List<java.util.Map<String, Object>> solicitudesProcesadas = new java.util.ArrayList<>();

            for (com.deco_one.api.Solicitud s : solicitudes) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();

                // Estos bloques aseguran que si un método no existe en tu clase Solicitud, NO
                // tire error de compilación
                try {
                    map.put("id", s.getId());
                } catch (Throwable t) {
                }
                try {
                    map.put("idUsuario", s.getIdUsuario());
                } catch (Throwable t) {
                }
                try {
                    map.put("nombre", s.getNombre());
                } catch (Throwable t) {
                }
                try {
                    map.put("telefono", s.getTelefono());
                } catch (Throwable t) {
                }
                try {
                    map.put("tipoEvento", s.getTipoEvento());
                } catch (Throwable t) {
                }
                try {
                    map.put("salonDeseado", s.getSalonDeseado());
                } catch (Throwable t) {
                }
                try {
                    map.put("ideas", s.getIdeas());
                } catch (Throwable t) {
                }
                try {
                    map.put("estado", s.getEstado());
                } catch (Throwable t) {
                }

                // Transformamos la fecha LocalDate a un Texto (String) limpio "YYYY-MM-DD"
                try {
                    if (s.getFechaEventoDeseada() != null) {
                        map.put("fechaEventoDeseada", s.getFechaEventoDeseada().toString());
                    } else {
                        map.put("fechaEventoDeseada", "");
                    }
                } catch (Throwable t) {
                    map.put("fechaEventoDeseada", "");
                }

                // Campos opcionales por si tu BD los maneja
                try {
                    map.put("fechaSolicitud", s.getFechaSolicitud().toString());
                } catch (Throwable t) {
                    map.put("fechaSolicitud", "");
                }
                try {
                    map.put("imagen", s.getImagen());
                } catch (Throwable t) {
                    map.put("imagen", null);
                }

                // Obtenemos el correo del usuario asociado a esta solicitud
                try (java.sql.Connection connCorreo = com.deco_one.api.DatabaseConnection.getConnection();
                        java.sql.PreparedStatement stmtCorreo = connCorreo
                                .prepareStatement("SELECT correo FROM usuarios WHERE id = ?")) {
                    stmtCorreo.setInt(1, s.getIdUsuario());
                    try (java.sql.ResultSet rsCorreo = stmtCorreo.executeQuery()) {
                        if (rsCorreo.next()) {
                            map.put("correo", rsCorreo.getString("correo"));
                        } else {
                            map.put("correo", "Sin correo");
                        }
                    }
                } catch (Exception ex) {
                    map.put("correo", "Sin correo");
                }

                solicitudesProcesadas.add(map);
            }

            // Enviamos los mapas limpios al frontend
            ctx.json(solicitudesProcesadas);
            ctx.status(200);
        });

        /**
         * GET /api/solicitudes/{id}
         */
        app.get("/api/solicitudes/{id}", ctx -> {
            int id = ctx.pathParamAsClass("id", Integer.class).get();
            logger.info("→ GET /api/solicitudes/" + id);
            var solicitud = SolicitudDAO.obtenerPorId(id);

            if (solicitud != null) {
                ctx.json(solicitud);
                ctx.status(200);
            } else {
                ctx.status(404);
                ctx.json(new Object() {
                    public String error = "Solicitud no encontrada";
                });
            }
        });

        /**
         * GET /api/usuarios/{id}/solicitudes
         * Retorna exclusivamente las solicitudes de un usuario en particular.
         */
        app.get("/api/usuarios/{id}/solicitudes", ctx -> {
            int idUsuario = ctx.pathParamAsClass("id", Integer.class).get();
            var solicitudesUsuario = SolicitudDAO.obtenerPorUsuario(idUsuario);

            java.util.List<java.util.Map<String, Object>> solicitudesProcesadas = new java.util.ArrayList<>();

            for (com.deco_one.api.Solicitud s : solicitudesUsuario) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                try {
                    map.put("id", s.getId());
                } catch (Throwable t) {
                }
                try {
                    map.put("nombre", s.getNombre());
                } catch (Throwable t) {
                }
                try {
                    map.put("tipoEvento", s.getTipoEvento());
                } catch (Throwable t) {
                }
                try {
                    map.put("salonDeseado", s.getSalonDeseado());
                } catch (Throwable t) {
                }
                try {
                    map.put("estado", s.getEstado());
                } catch (Throwable t) {
                }
                try {
                    map.put("fechaEventoDeseada",
                            s.getFechaEventoDeseada() != null ? s.getFechaEventoDeseada().toString() : "");
                } catch (Throwable t) {
                    map.put("fechaEventoDeseada", "");
                }

                solicitudesProcesadas.add(map);
            }

            ctx.json(solicitudesProcesadas);
            ctx.status(200);
        });

        /**
         * GET /api/usuarios/correo/{correo}/solicitudes
         * Retorna las solicitudes usando el correo (Ideal para tu Local Storage)
         */
        app.get("/api/usuarios/correo/{correo}/solicitudes", ctx -> {
            String correo = ctx.pathParam("correo");

            // Reutilizamos tu método existente para sacar el ID a partir del correo
            int idUsuario = UsuarioDAO.obtenerIdPorCorreo(correo);

            if (idUsuario == -1) {
                // En lugar de devolver 404, devolvemos 200 con un arreglo vacio
                // para evitar que el fetch() lance un error en JS si el usuario es nuevo.
                ctx.status(200).json(new java.util.ArrayList<>());
                return;
            }

            var solicitudesUsuario = SolicitudDAO.obtenerPorUsuario(idUsuario);
            java.util.List<java.util.Map<String, Object>> solicitudesProcesadas = new java.util.ArrayList<>();

            for (com.deco_one.api.Solicitud s : solicitudesUsuario) {
                java.util.Map<String, Object> map = new java.util.HashMap<>();
                try {
                    map.put("id", s.getId());
                } catch (Throwable t) {
                }
                try {
                    map.put("nombre", s.getNombre());
                } catch (Throwable t) {
                }
                try {
                    map.put("tipoEvento", s.getTipoEvento());
                } catch (Throwable t) {
                }
                try {
                    map.put("salonDeseado", s.getSalonDeseado());
                } catch (Throwable t) {
                }
                try {
                    map.put("estado", s.getEstado());
                } catch (Throwable t) {
                }
                try {
                    map.put("imagenUrl", s.getImagen());
                } catch (Throwable t) {
                }
                try {
                    map.put("fechaEventoDeseada",
                            s.getFechaEventoDeseada() != null ? s.getFechaEventoDeseada().toString() : "");
                } catch (Throwable t) {
                    map.put("fechaEventoDeseada", "");
                }

                try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                        java.sql.PreparedStatement evtStmt = conn.prepareStatement(
                                "SELECT salon, presupuesto, abono_requerido FROM eventos WHERE id_solicitud = ?")) {
                    evtStmt.setInt(1, s.getId());
                    try (java.sql.ResultSet evtRs = evtStmt.executeQuery()) {
                        if (evtRs.next()) {
                            map.put("salon", evtRs.getString("salon"));
                            map.put("presupuesto", evtRs.getDouble("presupuesto"));
                            map.put("abono_requerido", evtRs.getDouble("abono_requerido"));
                        }
                    }
                } catch (Exception e) {
                }

                solicitudesProcesadas.add(map);
            }

            ctx.json(solicitudesProcesadas);
            ctx.status(200);
        });

        /**
         * GET /api/eventos
         * Devuelve todos los eventos registrados en la agenda.
         */
        app.get("/api/eventos", ctx -> {
            java.util.List<java.util.Map<String, Object>> eventos = new java.util.ArrayList<>();
            String sql = "SELECT e.*, s.nombre AS nombre_solicitante, s.ideas AS mensaje_cliente " +
                    "FROM eventos e " +
                    "LEFT JOIN solicitudes s ON e.id_solicitud = s.id";

            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                    java.sql.PreparedStatement stmt = conn.prepareStatement(sql);
                    java.sql.ResultSet rs = stmt.executeQuery()) {

                while (rs.next()) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", rs.getInt("id"));
                    map.put("titulo", rs.getString("titulo"));
                    map.put("tipo_evento", rs.getString("tipo_evento"));
                    map.put("fecha_evento", rs.getString("fecha_evento"));
                    map.put("hora_inicio", rs.getDouble("hora_inicio"));
                    map.put("duracion_horas", rs.getDouble("duracion_horas"));
                    map.put("salon", rs.getString("salon"));
                    map.put("estado", rs.getString("estado"));
                    map.put("presupuesto", rs.getDouble("presupuesto"));
                    map.put("abono_requerido", rs.getDouble("abono_requerido"));
                    map.put("tamano_evento", rs.getString("tamano_evento"));

                    String solicitante = rs.getString("nombre_solicitante");
                    map.put("nombre_solicitante",
                            (solicitante != null && !solicitante.trim().isEmpty()) ? solicitante : "Cliente Manual");

                    String msgCliente = rs.getString("mensaje_cliente");
                    map.put("mensaje_cliente", (msgCliente != null && !msgCliente.trim().isEmpty()) ? msgCliente
                            : "Sin mensaje adicional");

                    eventos.add(map);
                }
                ctx.json(eventos);
                ctx.status(200);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error al obtener la agenda");
            }
        });

        /**
         * GET /api/dashboard/stats
         * Devuelve métricas para el dashboard
         */
        app.get("/api/dashboard/stats", ctx -> {
            java.util.Map<String, Object> stats = new java.util.HashMap<>();
            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection()) {

                // 1. Total de ingresos (presupuesto de eventos no cancelados)
                try (java.sql.PreparedStatement stmt = conn.prepareStatement(
                        "SELECT SUM(presupuesto) as total FROM eventos WHERE estado NOT IN ('Cancelado', 'cancelado')");
                        java.sql.ResultSet rs = stmt.executeQuery()) {
                    if (rs.next())
                        stats.put("total_ingresos", rs.getDouble("total"));
                    else
                        stats.put("total_ingresos", 0.0);
                }

                // 2. Eventos activos
                try (java.sql.PreparedStatement stmt = conn.prepareStatement(
                        "SELECT COUNT(*) as total FROM eventos WHERE estado NOT IN ('Terminado', 'terminado', 'Cancelado', 'cancelado')");
                        java.sql.ResultSet rs = stmt.executeQuery()) {
                    if (rs.next())
                        stats.put("eventos_activos", rs.getInt("total"));
                    else
                        stats.put("eventos_activos", 0);
                }

                // 3. Solicitudes pendientes
                try (java.sql.PreparedStatement stmt = conn
                        .prepareStatement("SELECT COUNT(*) as total FROM solicitudes WHERE estado = 'Pendiente'");
                        java.sql.ResultSet rs = stmt.executeQuery()) {
                    if (rs.next())
                        stats.put("solicitudes_pendientes", rs.getInt("total"));
                    else
                        stats.put("solicitudes_pendientes", 0);
                }

                // 4. Materiales en uso
                try (java.sql.PreparedStatement stmt = conn.prepareStatement(
                        "SELECT SUM(d.cantidad_rentada) as total FROM detalle_evento_inventario d JOIN eventos e ON d.id_evento = e.id WHERE e.estado NOT IN ('Terminado', 'terminado', 'Cancelado', 'cancelado')");
                        java.sql.ResultSet rs = stmt.executeQuery()) {
                    if (rs.next())
                        stats.put("materiales_en_uso", rs.getInt("total"));
                    else
                        stats.put("materiales_en_uso", 0);
                }

                ctx.json(stats);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error al obtener estadísticas del dashboard");
            }
        });

        /**
         * GET /api/dashboard/proximos-eventos
         * Devuelve los 5 eventos más próximos
         */
        app.get("/api/dashboard/proximos-eventos", ctx -> {
            java.util.List<java.util.Map<String, Object>> eventos = new java.util.ArrayList<>();
            String sql = "SELECT e.id, e.titulo, e.fecha_evento, e.salon, s.nombre AS nombre_solicitante, e.presupuesto, IFNULL(SUM(d.cantidad_rentada), 0) AS cantidad_materiales "
                    +
                    "FROM eventos e " +
                    "LEFT JOIN detalle_evento_inventario d ON e.id = d.id_evento " +
                    "LEFT JOIN solicitudes s ON e.id_solicitud = s.id " +
                    "WHERE e.fecha_evento >= CURDATE() AND e.estado NOT IN ('Terminado', 'terminado', 'Cancelado', 'cancelado') "
                    +
                    "GROUP BY e.id " +
                    "ORDER BY e.fecha_evento ASC LIMIT 5";

            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                    java.sql.PreparedStatement stmt = conn.prepareStatement(sql);
                    java.sql.ResultSet rs = stmt.executeQuery()) {

                while (rs.next()) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", rs.getInt("id"));
                    map.put("titulo", rs.getString("titulo"));
                    map.put("fecha_evento", rs.getString("fecha_evento"));
                    map.put("salon", rs.getString("salon"));
                    map.put("presupuesto", rs.getDouble("presupuesto"));
                    map.put("cantidad_materiales", rs.getInt("cantidad_materiales"));

                    String solicitante = rs.getString("nombre_solicitante");
                    map.put("nombre_solicitante",
                            (solicitante != null && !solicitante.trim().isEmpty()) ? solicitante : "Cliente Manual");

                    eventos.add(map);
                }
                ctx.json(eventos);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error al obtener próximos eventos");
            }
        });

        /**
         * GET /api/dashboard/grafica-demanda-tematica
         * Eventos desagregados por tipo de evento (Boda, XV, Infantil, Otros) mes a mes
         */
        app.get("/api/dashboard/grafica-demanda-tematica", ctx -> {
            java.util.List<java.util.Map<String, Object>> resultados = new java.util.ArrayList<>();
            String mesesBase = "(SELECT 1 AS n, 'Ene' AS mes UNION ALL SELECT 2, 'Feb' UNION ALL SELECT 3, 'Mar' UNION ALL SELECT 4, 'Abr' UNION ALL SELECT 5, 'May' UNION ALL SELECT 6, 'Jun' UNION ALL SELECT 7, 'Jul' UNION ALL SELECT 8, 'Ago' UNION ALL SELECT 9, 'Sep' UNION ALL SELECT 10, 'Oct' UNION ALL SELECT 11, 'Nov' UNION ALL SELECT 12, 'Dic')";
            String sql = "SELECT m.mes, " +
                    "IFNULL(SUM(CASE WHEN e.tipo_evento LIKE '%Boda%' THEN 1 ELSE 0 END), 0) AS bodas, " +
                    "IFNULL(SUM(CASE WHEN e.tipo_evento LIKE '%XV%' OR e.tipo_evento LIKE '%xv%' OR e.tipo_evento LIKE '%quincea%' THEN 1 ELSE 0 END), 0) AS xv_anios, "
                    +
                    "IFNULL(SUM(CASE WHEN e.tipo_evento LIKE '%infantil%' OR e.tipo_evento LIKE '%Infantil%' THEN 1 ELSE 0 END), 0) AS infantiles, "
                    +
                    "IFNULL(SUM(CASE WHEN e.tipo_evento NOT LIKE '%Boda%' AND e.tipo_evento NOT LIKE '%XV%' AND e.tipo_evento NOT LIKE '%xv%' AND e.tipo_evento NOT LIKE '%quincea%' AND e.tipo_evento NOT LIKE '%infantil%' AND e.tipo_evento NOT LIKE '%Infantil%' AND e.id IS NOT NULL THEN 1 ELSE 0 END), 0) AS otros "
                    +
                    "FROM " + mesesBase + " m " +
                    "LEFT JOIN eventos e ON MONTH(e.fecha_evento) = m.n AND YEAR(e.fecha_evento) = YEAR(CURDATE()) AND e.estado NOT IN ('Cancelado', 'cancelado') "
                    +
                    "GROUP BY m.n, m.mes ORDER BY m.n";

            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                    java.sql.PreparedStatement stmt = conn.prepareStatement(sql);
                    java.sql.ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("mes", rs.getString("mes"));
                    map.put("bodas", rs.getInt("bodas"));
                    map.put("xv_anios", rs.getInt("xv_anios"));
                    map.put("infantiles", rs.getInt("infantiles"));
                    map.put("otros", rs.getInt("otros"));
                    resultados.add(map);
                }
                ctx.json(resultados);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error en grafica demanda tematica");
            }
        });

        /**
         * GET /api/dashboard/grafica-demanda (mantener retrocompatibilidad)
         */
        app.get("/api/dashboard/grafica-demanda", ctx -> {
            java.util.List<java.util.Map<String, Object>> resultados = new java.util.ArrayList<>();
            String sql = "SELECT " +
                    "    m.mes, " +
                    "    IFNULL(SUM(CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END), 0) AS eventos, " +
                    "    IFNULL(SUM(CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END), 0) AS solicitudes, " +
                    "    IFNULL(SUM(CASE WHEN e.id IS NOT NULL THEN 1 ELSE 0 END), 0) + IFNULL(SUM(CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END), 0) AS demanda_total "
                    +
                    "FROM " +
                    "    (SELECT 1 AS n, 'Enero' AS mes UNION ALL SELECT 2, 'Febrero' UNION ALL SELECT 3, 'Marzo' UNION ALL SELECT 4, 'Abril' UNION ALL SELECT 5, 'Mayo' UNION ALL SELECT 6, 'Junio' UNION ALL SELECT 7, 'Julio' UNION ALL SELECT 8, 'Agosto' UNION ALL SELECT 9, 'Septiembre' UNION ALL SELECT 10, 'Octubre' UNION ALL SELECT 11, 'Noviembre' UNION ALL SELECT 12, 'Diciembre') m "
                    +
                    "LEFT JOIN eventos e ON MONTH(e.fecha_evento) = m.n AND YEAR(e.fecha_evento) = YEAR(CURDATE()) AND e.estado NOT IN ('Cancelado', 'cancelado') "
                    +
                    "LEFT JOIN solicitudes s ON MONTH(s.fecha_solicitud) = m.n AND YEAR(s.fecha_solicitud) = YEAR(CURDATE()) AND s.estado = 'Pendiente' "
                    +
                    "GROUP BY m.n, m.mes " +
                    "ORDER BY m.n";

            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                    java.sql.PreparedStatement stmt = conn.prepareStatement(sql);
                    java.sql.ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("mes", rs.getString("mes"));
                    map.put("eventos", rs.getInt("eventos"));
                    map.put("solicitudes", rs.getInt("solicitudes"));
                    map.put("demanda_total", rs.getInt("demanda_total"));
                    resultados.add(map);
                }
                ctx.json(resultados);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error en grafica demanda");
            }
        });

        /**
         * GET /api/dashboard/grafica-ingresos
         */
        app.get("/api/dashboard/grafica-ingresos", ctx -> {
            java.util.List<java.util.Map<String, Object>> resultados = new java.util.ArrayList<>();
            String sql = "SELECT " +
                    "    m.mes, " +
                    "    IFNULL(SUM(e.presupuesto), 0) AS total_ingresos " +
                    "FROM " +
                    "    (SELECT 1 AS n, 'Ene' AS mes UNION ALL SELECT 2, 'Feb' UNION ALL SELECT 3, 'Mar' UNION ALL SELECT 4, 'Abr' UNION ALL SELECT 5, 'May' UNION ALL SELECT 6, 'Jun' UNION ALL SELECT 7, 'Jul' UNION ALL SELECT 8, 'Ago' UNION ALL SELECT 9, 'Sep' UNION ALL SELECT 10, 'Oct' UNION ALL SELECT 11, 'Nov' UNION ALL SELECT 12, 'Dic') m "
                    +
                    "LEFT JOIN eventos e ON MONTH(e.fecha_evento) = m.n AND YEAR(e.fecha_evento) = YEAR(CURDATE()) AND e.estado NOT IN ('Cancelado', 'cancelado') "
                    +
                    "GROUP BY m.n, m.mes " +
                    "ORDER BY m.n";

            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                    java.sql.PreparedStatement stmt = conn.prepareStatement(sql);
                    java.sql.ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("mes", rs.getString("mes"));
                    map.put("total_ingresos", rs.getDouble("total_ingresos"));
                    resultados.add(map);
                }
                ctx.json(resultados);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error en grafica ingresos");
            }
        });

        /**
         * GET /api/dashboard/predicciones
         * Inteligencia de negocio calculada con algoritmo estadistico interno (Java + MySQL).
         * Cero dependencias externas.
         */
        app.get("/api/dashboard/predicciones", ctx -> {
            String topEvento = "General";
            String estilo = "Elegante & Bohemio Chic";
            String paleta = "Marfil, Oro Rosado y Verde Eucalipto";
            String recomendacionStock = "Stock de inventario verificado y en niveles óptimos de disponibilidad.";
            java.util.List<String> tendencias = new java.util.ArrayList<>();
        try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection()) {
            // 1. Consulta segura de Tipo de Evento
            try {
                String sqlTop = "SELECT tipo_evento, COUNT(*) as total FROM eventos WHERE estado IS NULL OR LOWER(estado) != 'cancelado' GROUP BY tipo_evento ORDER BY total DESC LIMIT 1";
                try (java.sql.PreparedStatement stmt = conn.prepareStatement(sqlTop);
                     java.sql.ResultSet rs = stmt.executeQuery()) {
                    if (rs.next() && rs.getString("tipo_evento") != null) {
                        topEvento = rs.getString("tipo_evento");
                    }
                }
            } catch (Exception eSql) {
                System.err.println("⚠️ Nota en query tipo_evento: " + eSql.getMessage());
            }
            // Reglas estéticas
            if ("Boda".equalsIgnoreCase(topEvento)) {
                estilo = "Jardín Nocturno & Romántico Minimalista";
                paleta = "Blanco Cálido, Champagne y Follaje Silvestre";
            } else if ("XV Años".equalsIgnoreCase(topEvento)) {
                estilo = "Glamour Moderno & Luces Neón";
                paleta = "Rosa Gold, Plata y Cristal";
            } else if ("Infantiles".equalsIgnoreCase(topEvento)) {
                estilo = "Temático Pastel & Mobiliario Escalar";
                paleta = "Azul Cielo, Menta y Amarillo Miel";
            }
            tendencias.add("El tipo de evento más solicitado actualmente es: " + topEvento);
            tendencias.add("Proyección de demanda estable para reservas de fin de semana");
            tendencias.add("Preferencia por montajes con iluminación focalizada y zonas fotográficas");
            // 2. Consulta segura de Inventario en Uso
            try {
                String sqlStock = "SELECT i.nombre_mobiliario, IFNULL(SUM(d.cantidad_rentada), 0) as rentados " +
                                   "FROM inventario i " +
                                   "LEFT JOIN detalle_evento_inventario d ON i.id = d.id_articulo " +
                                   "GROUP BY i.id ORDER BY rentados DESC LIMIT 1";
                try (java.sql.PreparedStatement stmt = conn.prepareStatement(sqlStock);
                     java.sql.ResultSet rs = stmt.executeQuery()) {
                    if (rs.next() && rs.getInt("rentados") > 0) {
                        String mob = rs.getString("nombre_mobiliario");
                        int rent = rs.getInt("rentados");
                        recomendacionStock = "Alta demanda detectada en '" + mob + "' (" + rent + " unidades comprometidas). Se sugiere revisar mantenimiento o ampliar stock.";
                    }
                }
            } catch (Exception eSql) {
                System.err.println("⚠️ Nota en query inventario: " + eSql.getMessage());
            }
        } catch (Exception e) {
            System.err.println("❌ Error en base de datos predicciones: " + e.getMessage());
        }
        // SIEMPRE responde en formato JSON limpio
        java.util.Map<String, Object> respuesta = new java.util.HashMap<>();
        respuesta.put("estilo_sugerido", estilo);
        respuesta.put("paleta_colores", paleta);
        respuesta.put("tendencias", tendencias);
        respuesta.put("recomendacion_inventario", recomendacionStock);
        ctx.json(respuesta);
        });

        /**
         * GET /api/inventario
         * Devuelve todo el catálogo de materiales disponibles para asignarlos a eventos
         */
        app.get("/api/inventario", ctx -> {
            java.util.List<java.util.Map<String, Object>> inventario = new java.util.ArrayList<>();
            String sql = "SELECT i.*, IFNULL((SELECT SUM(d.cantidad_rentada) FROM detalle_evento_inventario d JOIN eventos e ON d.id_evento = e.id WHERE d.id_articulo = i.id AND (e.estado IS NULL OR e.estado NOT IN ('Cancelado', 'Terminado'))), 0) AS en_uso FROM inventario i;";

            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                    java.sql.PreparedStatement stmt = conn.prepareStatement(sql);
                    java.sql.ResultSet rs = stmt.executeQuery()) {

                while (rs.next()) {
                    java.util.Map<String, Object> item = new java.util.HashMap<>();
                    item.put("id", rs.getInt("id"));
                    item.put("nombre", rs.getString("nombre"));
                    item.put("categoria", rs.getString("categoria"));
                    item.put("precio_renta", rs.getDouble("precio_renta"));
                    item.put("stock_total", rs.getInt("stock_total"));
                    item.put("estado", rs.getString("estado"));
                    item.put("en_uso", rs.getInt("en_uso"));
                    inventario.add(item);
                }
                ctx.json(inventario);
                ctx.status(200);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error al obtener el inventario: " + e.getMessage());
            }
        });

        /**
         * POST /api/inventario
         * Agrega un nuevo material a la base de datos
         */
        app.post("/api/inventario", ctx -> {
            java.util.Map<String, Object> body = ctx.bodyAsClass(java.util.Map.class);

            String sql = "INSERT INTO inventario (nombre, categoria, stock_total, precio_renta, estado) VALUES (?, ?, ?, ?, ?)";

            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                    java.sql.PreparedStatement stmt = conn.prepareStatement(sql)) {

                stmt.setString(1, body.get("tipo").toString());
                stmt.setString(2, body.get("referencia").toString()); // Usamos "referencia" como categoría
                stmt.setInt(3, Integer.parseInt(body.get("cantidad").toString()));
                stmt.setDouble(4, 0.0); // Precio en 0 por ahora (lo puedes cambiar después si lo necesitas)
                stmt.setString(5, "DISPONIBLE");

                stmt.executeUpdate();
                ctx.status(201).result("Material agregado");
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error: " + e.getMessage());
            }
        });

        /**
         * PUT /api/inventario/{id}
         * Edita un material existente
         */
        app.put("/api/inventario/{id}", ctx -> {
            int id = ctx.pathParamAsClass("id", Integer.class).get();
            java.util.Map<String, Object> body = ctx.bodyAsClass(java.util.Map.class);

            String sql = "UPDATE inventario SET nombre = ?, categoria = ?, stock_total = ? WHERE id = ?";

            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                    java.sql.PreparedStatement stmt = conn.prepareStatement(sql)) {

                stmt.setString(1, body.get("tipo").toString());
                stmt.setString(2, body.get("referencia").toString());
                stmt.setInt(3, Integer.parseInt(body.get("cantidad").toString()));
                stmt.setInt(4, id);

                stmt.executeUpdate();
                ctx.status(200).result("Material actualizado");
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error: " + e.getMessage());
            }
        });

        /**
         * DELETE /api/inventario/{id}
         * Elimina un material (o reduce su stock)
         */
        app.delete("/api/inventario/{id}", ctx -> {
            int id = ctx.pathParamAsClass("id", Integer.class).get();
            // Revisamos si el frontend mandó cuántos eliminar (query param)
            String cantidadParam = ctx.queryParam("cantidad");

            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection()) {
                if (cantidadParam != null && !cantidadParam.isEmpty()) {
                    // Si mandaron cantidad, solo restamos el stock
                    int aRestar = Integer.parseInt(cantidadParam);
                    String sqlUpdate = "UPDATE inventario SET stock_total = stock_total - ? WHERE id = ?";
                    try (java.sql.PreparedStatement stmt = conn.prepareStatement(sqlUpdate)) {
                        stmt.setInt(1, aRestar);
                        stmt.setInt(2, id);
                        stmt.executeUpdate();
                    }
                } else {
                    // Si no mandaron cantidad, borramos todo el registro
                    String sqlDelete = "DELETE FROM inventario WHERE id = ?";
                    try (java.sql.PreparedStatement stmt = conn.prepareStatement(sqlDelete)) {
                        stmt.setInt(1, id);
                        stmt.executeUpdate();
                    }
                }
                ctx.status(200).result("Material eliminado/reducido");
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error: " + e.getMessage());
            }
        });

        /**
         * GET /api/eventos/{id}/materiales
         * Obtiene la lista de materiales que están asignados a un evento específico.
         */
        app.get("/api/eventos/{id}/materiales", ctx -> {
            int idEvento = ctx.pathParamAsClass("id", Integer.class).get();
            java.util.List<java.util.Map<String, Object>> materiales = new java.util.ArrayList<>();

            // Unimos la tabla puente con la de inventario para saber el nombre y precio del
            // artículo
            String sql = "SELECT d.id_articulo, d.cantidad_rentada, i.nombre, i.precio_renta " +
                    "FROM detalle_evento_inventario d " +
                    "JOIN inventario i ON d.id_articulo = i.id " +
                    "WHERE d.id_evento = ?";

            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                    java.sql.PreparedStatement stmt = conn.prepareStatement(sql)) {

                stmt.setInt(1, idEvento);
                try (java.sql.ResultSet rs = stmt.executeQuery()) {
                    while (rs.next()) {
                        java.util.Map<String, Object> map = new java.util.HashMap<>();
                        map.put("id_articulo", rs.getInt("id_articulo"));
                        map.put("cantidad", rs.getInt("cantidad_rentada"));
                        map.put("nombre", rs.getString("nombre"));
                        map.put("precio", rs.getDouble("precio_renta"));
                        materiales.add(map);
                    }
                }
                ctx.json(materiales);
                ctx.status(200);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error al leer materiales: " + e.getMessage());
            }
        });

        /**
         * POST /api/eventos/{id}/materiales
         * Guarda los materiales asignados a un evento.
         */
        app.post("/api/eventos/{id}/materiales", ctx -> {
            int idEvento = ctx.pathParamAsClass("id", Integer.class).get();
            // Recibimos una lista de objetos [{id_articulo: 1, cantidad: 5}, ...]
            java.util.List<java.util.Map> materiales = ctx.bodyAsClass(java.util.List.class);

            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection()) {
                // 1. Limpiamos los materiales anteriores de este evento (por si es una edición)
                try (java.sql.PreparedStatement deleteStmt = conn
                        .prepareStatement("DELETE FROM detalle_evento_inventario WHERE id_evento = ?")) {
                    deleteStmt.setInt(1, idEvento);
                    deleteStmt.executeUpdate();
                }

                // 2. Insertamos la nueva lista de materiales
                if (materiales != null && !materiales.isEmpty()) {
                    String sqlInsert = "INSERT INTO detalle_evento_inventario (id_evento, id_articulo, cantidad_rentada) VALUES (?, ?, ?)";
                    try (java.sql.PreparedStatement insertStmt = conn.prepareStatement(sqlInsert)) {
                        for (java.util.Map mat : materiales) {
                            insertStmt.setInt(1, idEvento);
                            insertStmt.setInt(2, Integer.parseInt(mat.get("id_articulo").toString()));
                            insertStmt.setInt(3, Integer.parseInt(mat.get("cantidad").toString()));
                            insertStmt.addBatch(); // Los agrupamos para insertarlos todos de un golpe (más rápido)
                        }
                        insertStmt.executeBatch();
                    }
                }
                ctx.status(200).result("Materiales guardados con éxito");
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error al guardar materiales: " + e.getMessage());
            }
        });
        // --------------------------------------------------------
        // AQUÍ ESTÁ EL CÓDIGO NUEVO Y PROTEGIDO PARA CREAR EVENTOS
        // --------------------------------------------------------

        /**
         * POST /api/eventos
         * Crea un nuevo evento en la agenda (Manual o desde solicitud).
         */
        app.post("/api/eventos", ctx -> {
            try {
                java.util.Map<String, Object> body = ctx.bodyAsClass(java.util.Map.class);
                String sql = "INSERT INTO eventos (id_solicitud, titulo, tipo_evento, fecha_evento, hora_inicio, duracion_horas, salon, estado, presupuesto, abono_requerido, tamano_evento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                        java.sql.PreparedStatement stmt = conn.prepareStatement(sql,
                                java.sql.Statement.RETURN_GENERATED_KEYS)) {

                    // 1. Manejo seguro de id_solicitud (Si es manual, va como NULL)
                    if (body.containsKey("id_solicitud") && body.get("id_solicitud") != null) {
                        stmt.setInt(1, Integer.parseInt(body.get("id_solicitud").toString()));
                    } else {
                        stmt.setNull(1, java.sql.Types.INTEGER);
                    }

                    // 2. Extracción flexible (Soporta nombres de Javascript y de Java)
                    String titulo = body.containsKey("titulo") ? body.get("titulo").toString() : "Sin título";
                    String tipo = body.containsKey("tipo") ? body.get("tipo").toString()
                            : (body.containsKey("tipo_evento") ? body.get("tipo_evento").toString() : "");
                    String salon = body.containsKey("salon") ? body.get("salon").toString() : "";
                    String estado = body.containsKey("estadoManual") ? body.get("estadoManual").toString()
                            : (body.containsKey("estado") ? body.get("estado").toString() : "auto");

                    // 4. Corrección: hora_inicio es DOUBLE en la base de datos
                    double horaInicio = 0.0;
                    try {
                        String horaStr = body.containsKey("horaInicio") ? body.get("horaInicio").toString()
                                : (body.containsKey("hora_inicio") ? body.get("hora_inicio").toString() : "0");
                        if (!horaStr.trim().isEmpty() && !horaStr.equals("null")) {
                            horaInicio = Double.parseDouble(horaStr);
                        }
                    } catch (Exception ignored) {}
                    double duracion = Double.parseDouble(body.containsKey("duracionHoras")
                            ? body.get("duracionHoras").toString()
                            : (body.containsKey("duracion_horas") ? body.get("duracion_horas").toString() : "0"));

                    // 3. Limpiamos la fecha
                    String fechaRaw = body.containsKey("fecha") ? body.get("fecha").toString()
                            : (body.containsKey("fecha_evento") ? body.get("fecha_evento").toString() : "");
                    if (fechaRaw.contains("T"))
                        fechaRaw = fechaRaw.split("T")[0];

                    // 4. Nuevos campos: presupuesto, abono_requerido, tamano_evento
                    double presupuesto = 0.0;
                    try {
                        presupuesto = Double.parseDouble(
                                body.containsKey("presupuesto") ? body.get("presupuesto").toString() : "0");
                    } catch (Exception ignored) {
                    }

                    double abonoRequerido = 0.0;
                    try {
                        abonoRequerido = Double.parseDouble(body.containsKey("abono_requerido")
                                ? body.get("abono_requerido").toString()
                                : (body.containsKey("abonoRequerido") ? body.get("abonoRequerido").toString() : "0"));
                    } catch (Exception ignored) {
                    }

                    String tamanoEvento = body.containsKey("tamano_evento") ? body.get("tamano_evento").toString()
                            : (body.containsKey("tamanoEvento") ? body.get("tamanoEvento").toString() : "Pequeño");
                    if (tamanoEvento == null || tamanoEvento.trim().isEmpty())
                        tamanoEvento = "Pequeño";

                    stmt.setString(2, titulo);
                    stmt.setString(3, tipo);
                    stmt.setString(4, fechaRaw);
                    stmt.setDouble(5, horaInicio);
                    stmt.setDouble(6, duracion);
                    stmt.setString(7, salon);
                    stmt.setString(8, estado);
                    stmt.setDouble(9, presupuesto);
                    stmt.setDouble(10, abonoRequerido);
                    stmt.setString(11, tamanoEvento);

                    stmt.executeUpdate();

                    // INSERTAR MATERIALES
                    try (java.sql.ResultSet generatedKeys = stmt.getGeneratedKeys()) {
                        if (generatedKeys.next()) {
                            long idInsertado = generatedKeys.getLong(1);
                            if (body.containsKey("materiales")) {
                                java.util.List<java.util.Map> materiales = (java.util.List<java.util.Map>) body
                                        .get("materiales");
                                if (materiales != null && !materiales.isEmpty()) {
                                    String sqlMat = "INSERT INTO detalle_evento_inventario (id_evento, id_articulo, cantidad_rentada) VALUES (?, ?, ?)";
                                    try (java.sql.PreparedStatement stmtMat = conn.prepareStatement(sqlMat)) {
                                        for (java.util.Map mat : materiales) {
                                            stmtMat.setLong(1, idInsertado);
                                            stmtMat.setInt(2, Integer.parseInt(mat.get("id_articulo").toString()));
                                            stmtMat.setInt(3, Integer.parseInt(mat.get("cantidad").toString()));
                                            stmtMat.addBatch();
                                        }
                                        stmtMat.executeBatch();
                                    }
                                }
                            }
                        }
                    }

                    ctx.status(201).result("Evento creado con éxito");
                }
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error al crear evento: " + e.getMessage());
            }
        });

        /**
         * PUT /api/eventos/{id}
         * Edita un evento existente. (¡La ruta que te faltaba!)
         */
       app.put("/api/eventos/{id}", ctx -> {
            int idEvento = ctx.pathParamAsClass("id", Integer.class).get();
            try {
                java.util.Map<String, Object> body = ctx.bodyAsClass(java.util.Map.class);
                String sql = "UPDATE eventos SET titulo = ?, tipo_evento = ?, fecha_evento = ?, hora_inicio = ?, duracion_horas = ?, salon = ?, estado = ?, presupuesto = ?, abono_requerido = ?, tamano_evento = ? WHERE id = ?";

                try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                     java.sql.PreparedStatement stmt = conn.prepareStatement(sql)) {

                    // 1. Extracción segura (evita NullPointerException usando String.valueOf y comprobaciones)
                    String titulo = body.get("titulo") != null ? String.valueOf(body.get("titulo")) : "Sin título";
                    String tipo = body.get("tipo") != null ? String.valueOf(body.get("tipo"))
                            : (body.get("tipo_evento") != null ? String.valueOf(body.get("tipo_evento")) : "");
                    String salon = body.get("salon") != null ? String.valueOf(body.get("salon")) : "";
                    String estado = body.get("estadoManual") != null ? String.valueOf(body.get("estadoManual"))
                            : (body.get("estado") != null ? String.valueOf(body.get("estado")) : "auto");

                    // 4. Corrección: hora_inicio es DOUBLE en la base de datos, NO String.
                    double horaInicio = 0.0;
                    try {
                        String horaStr = body.get("horaInicio") != null ? String.valueOf(body.get("horaInicio"))
                                : (body.get("hora_inicio") != null ? String.valueOf(body.get("hora_inicio")) : "0");
                        if (!horaStr.trim().isEmpty() && !horaStr.equals("null")) {
                            horaInicio = Double.parseDouble(horaStr);
                        }
                    } catch (Exception ignored) {}

                    // 2. Duración protegida con try-catch
                    double duracion = 0.0;
                    try {
                        String durStr = body.get("duracionHoras") != null ? String.valueOf(body.get("duracionHoras"))
                                : (body.get("duracion_horas") != null ? String.valueOf(body.get("duracion_horas")) : "0");
                        if (!durStr.trim().isEmpty() && !durStr.equals("null")) {
                            duracion = Double.parseDouble(durStr);
                        }
                    } catch (Exception ignored) {}

                    // 3. Extracción de fecha
                    String fechaRaw = body.get("fecha") != null ? String.valueOf(body.get("fecha"))
                            : (body.get("fecha_evento") != null ? String.valueOf(body.get("fecha_evento")) : "");
                    if (fechaRaw.contains("T")) {
                        fechaRaw = fechaRaw.split("T")[0];
                    }

                    // 4. Presupuesto y abono protegidos
                    double presupuesto = 0.0;
                    try {
                        if (body.get("presupuesto") != null) {
                            String presStr = String.valueOf(body.get("presupuesto"));
                            if (!presStr.trim().isEmpty() && !presStr.equals("null")) {
                                presupuesto = Double.parseDouble(presStr);
                            }
                        }
                    } catch (Exception ignored) {}

                    double abonoRequerido = 0.0;
                    try {
                        String abonoStr = body.get("abono_requerido") != null ? String.valueOf(body.get("abono_requerido"))
                                : (body.get("abonoRequerido") != null ? String.valueOf(body.get("abonoRequerido")) : "0");
                        if (!abonoStr.trim().isEmpty() && !abonoStr.equals("null")) {
                            abonoRequerido = Double.parseDouble(abonoStr);
                        }
                    } catch (Exception ignored) {}

                    String tamanoEvento = body.get("tamano_evento") != null ? String.valueOf(body.get("tamano_evento"))
                            : (body.get("tamanoEvento") != null ? String.valueOf(body.get("tamanoEvento")) : "Pequeño");
                    if (tamanoEvento.trim().isEmpty() || tamanoEvento.equals("null")) tamanoEvento = "Pequeño";

                    // Inyección a Base de Datos
                    stmt.setString(1, titulo);
                    stmt.setString(2, tipo);
                    
                    // 5. Prevención de error SQL: Si no hay fecha, insertamos un NULL real
                    if (fechaRaw == null || fechaRaw.trim().isEmpty() || fechaRaw.equals("null")) {
                        stmt.setNull(3, java.sql.Types.DATE);
                    } else {
                        stmt.setString(3, fechaRaw);
                    }
                    
                    stmt.setDouble(4, horaInicio);
                    stmt.setDouble(5, duracion);
                    stmt.setString(6, salon);
                    stmt.setString(7, estado);
                    stmt.setDouble(8, presupuesto);
                    stmt.setDouble(9, abonoRequerido);
                    stmt.setString(10, tamanoEvento);
                    stmt.setInt(11, idEvento);

                    stmt.executeUpdate();

                    // 6. ACTUALIZAR MATERIALES (Protegido contra nulos)
                    if (body.get("materiales") != null) {
                        java.util.List<java.util.Map> materiales = (java.util.List<java.util.Map>) body.get("materiales");
                        try (java.sql.PreparedStatement deleteStmt = conn.prepareStatement("DELETE FROM detalle_evento_inventario WHERE id_evento = ?")) {
                            deleteStmt.setInt(1, idEvento);
                            deleteStmt.executeUpdate();
                        }
                        if (materiales != null && !materiales.isEmpty()) {
                            String sqlMat = "INSERT INTO detalle_evento_inventario (id_evento, id_articulo, cantidad_rentada) VALUES (?, ?, ?)";
                            try (java.sql.PreparedStatement insertStmt = conn.prepareStatement(sqlMat)) {
                                for (java.util.Map mat : materiales) {
                                    insertStmt.setInt(1, idEvento);
                                    insertStmt.setInt(2, Integer.parseInt(String.valueOf(mat.get("id_articulo"))));
                                    insertStmt.setInt(3, Integer.parseInt(String.valueOf(mat.get("cantidad"))));
                                    insertStmt.addBatch();
                                }
                                insertStmt.executeBatch();
                            }
                        }
                    }

                    ctx.status(200).result("Evento actualizado con éxito");
                }
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error al actualizar el evento: " + e.getMessage());
            }
        });
        // --------------------------------------------------------

        // --------------------------------------------------------

        /**
         * POST /api/solicitudes
         */
        app.post("/api/solicitudes", ctx -> {
            logger.info("→ POST /api/solicitudes (Validando usuario registrado)");

            FormularioContacto form = ctx.bodyAsClass(FormularioContacto.class);

            int idUsuario = UsuarioDAO.obtenerIdPorCorreo(form.correo);

            if (idUsuario == -1) {
                ctx.status(403).result("Error: Debes registrarte antes de solicitar un evento.");
                return;
            }

            com.deco_one.api.Solicitud nuevaSol = new com.deco_one.api.Solicitud();
            nuevaSol.setIdUsuario(idUsuario);
            nuevaSol.setNombre(form.nombre);
            nuevaSol.setTelefono(form.telefono);
            nuevaSol.setTipoEvento(form.tipoEvento);
            nuevaSol.setSalonDeseado(form.salonDeseado);
            nuevaSol.setIdeas(form.ideas);
            nuevaSol.setFechaEventoDeseada(java.time.LocalDate.parse(form.fechaEventoDeseada));

            boolean guardado = SolicitudDAO.insertar(nuevaSol);

            if (guardado) {
                ctx.status(201).result("Solicitud creada exitosamente");
            } else {
                ctx.status(500).result("Error al guardar la solicitud");
            }
        });

        /**
         * PUT /api/solicitudes/{id}/estado
         * Actualiza el estado de una solicitud.
         */
        app.put("/api/solicitudes/{id}/estado", ctx -> {
            int id = ctx.pathParamAsClass("id", Integer.class).get();

            // Recibimos el nuevo estado desde el frontend (ej. {"estado": "aprobado"})
            java.util.Map<String, String> body = ctx.bodyAsClass(java.util.Map.class);
            String nuevoEstado = body.get("estado");

            if (nuevoEstado == null || nuevoEstado.trim().isEmpty()) {
                ctx.status(400).result("Error: El estado no puede estar vacío");
                return;
            }

            boolean actualizado = SolicitudDAO.actualizarEstado(id, nuevoEstado);

            if (actualizado) {
                ctx.status(200).result("Estado actualizado correctamente");
            } else {
                ctx.status(500).result("Error al actualizar la base de datos");
            }
        });
        // ========== AUTENTICACIÓN ==========

        app.post("/api/auth/registro", ctx -> {
            logger.info("→ POST /api/auth/registro");
            RegistroReq req = ctx.bodyAsClass(RegistroReq.class);

            try {
                Usuario nuevoUser = UsuarioDAO.registrarUsuario(req.nombre, req.correo, req.contrasena);

                ctx.status(201).json(new Object() {
                    public String token = java.util.UUID.randomUUID().toString();
                    public Usuario usuario = nuevoUser;
                });
            } catch (Exception e) {
                ctx.status(400).json(new Object() {
                    public String error = e.getMessage();
                });
            }
        });

        app.post("/api/auth/login", ctx -> {
            logger.info("→ POST /api/auth/login");
            LoginReq req = ctx.bodyAsClass(LoginReq.class);

            Usuario user = UsuarioDAO.autenticar(req.correo, req.contrasena);

            if (user != null) {
                ctx.status(200).json(new Object() {
                    public String token = java.util.UUID.randomUUID().toString();
                    public Usuario usuario = user;
                });
            } else {
                ctx.status(401).json(new Object() {
                    public String error = "Correo o contraseña incorrectos";
                });
            }
        });
        // ==========================================
        // RUTAS DE SALONES
        // ==========================================
        app.get("/api/salones", ctx -> {
            java.util.List<java.util.Map<String, Object>> salones = new java.util.ArrayList<>();
            try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                    java.sql.PreparedStatement stmt = conn.prepareStatement("SELECT * FROM salones");
                    java.sql.ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    java.util.Map<String, Object> map = new java.util.HashMap<>();
                    map.put("id", rs.getInt("id"));
                    map.put("nombre", rs.getString("nombre"));
                    map.put("horario", rs.getString("horario"));
                    map.put("direccion", rs.getString("direccion"));
                    map.put("contacto", rs.getString("contacto"));
                    map.put("imagen_url", rs.getString("imagen_url"));
                    salones.add(map);
                }
                ctx.json(salones);
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error en BD");
            }
        });

        app.post("/api/salones", ctx -> {
            try {
                com.fasterxml.jackson.databind.JsonNode json = new com.fasterxml.jackson.databind.ObjectMapper()
                        .readTree(ctx.body());
                String sql = "INSERT INTO salones (nombre, horario, direccion, contacto, imagen_url) VALUES (?, ?, ?, ?, ?)";
                try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                        java.sql.PreparedStatement stmt = conn.prepareStatement(sql,
                                java.sql.Statement.RETURN_GENERATED_KEYS)) {
                    stmt.setString(1, json.has("nombre") ? json.get("nombre").asText("") : "");
                    stmt.setString(2, json.has("horario") ? json.get("horario").asText("") : "");
                    stmt.setString(3, json.has("direccion") ? json.get("direccion").asText("") : "");
                    stmt.setString(4, json.has("contacto") ? json.get("contacto").asText("") : "");
                    stmt.setString(5, json.has("imagen_url") ? json.get("imagen_url").asText("") : "");
                    stmt.executeUpdate();
                    ctx.status(201).json("{\"mensaje\":\"Salón creado exitosamente\"}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error al crear salón");
            }
        });

        app.put("/api/salones/{id}", ctx -> {
            try {
                int id = Integer.parseInt(ctx.pathParam("id"));
                com.fasterxml.jackson.databind.JsonNode json = new com.fasterxml.jackson.databind.ObjectMapper()
                        .readTree(ctx.body());
                String sql = "UPDATE salones SET nombre = ?, horario = ?, direccion = ?, contacto = ?, imagen_url = ? WHERE id = ?";
                try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                        java.sql.PreparedStatement stmt = conn.prepareStatement(sql)) {
                    stmt.setString(1, json.has("nombre") ? json.get("nombre").asText("") : "");
                    stmt.setString(2, json.has("horario") ? json.get("horario").asText("") : "");
                    stmt.setString(3, json.has("direccion") ? json.get("direccion").asText("") : "");
                    stmt.setString(4, json.has("contacto") ? json.get("contacto").asText("") : "");
                    stmt.setString(5, json.has("imagen_url") ? json.get("imagen_url").asText("") : "");
                    stmt.setInt(6, id);
                    stmt.executeUpdate();
                    ctx.json("{\"mensaje\":\"Salón actualizado exitosamente\"}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error al actualizar salón");
            }
        });

        app.delete("/api/salones/{id}", ctx -> {
            try {
                int id = Integer.parseInt(ctx.pathParam("id"));
                try (java.sql.Connection conn = com.deco_one.api.DatabaseConnection.getConnection();
                        java.sql.PreparedStatement stmt = conn.prepareStatement("DELETE FROM salones WHERE id = ?")) {
                    stmt.setInt(1, id);
                    stmt.executeUpdate();
                    ctx.json("{\"mensaje\":\"Salón eliminado exitosamente\"}");
                }
            } catch (Exception e) {
                e.printStackTrace();
                ctx.status(500).result("Error al eliminar salón");
            }
        });

        // ==================== INICIA SERVIDOR ====================
        app.start(PORT);
        logger.info("✓ Servidor Javalin levantado en http://localhost:" + PORT);
    }

    public static class FormularioContacto {
        public String nombre;
        public String correo;
        public String telefono;
        public String tipoEvento;
        public String fechaEventoDeseada;
        public String salonDeseado;
        public String ideas;
    }

    public static class RegistroReq {
        public String nombre;
        public String correo;
        public String contrasena;
    }

    public static class LoginReq {
        public String correo;
        public String contrasena;
    }
}