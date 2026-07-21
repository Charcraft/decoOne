package com.deco_one.api;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;

/**
 * POJO que representa una solicitud en la BD.
 * Jackson lo convierte a JSON automáticamente.
 */
public class Solicitud {
    private int id;
    private int idUsuario;
    private String nombre;
    private String tipoEvento;
    
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate fechaEventoDeseada;
    
    private String salonDeseado;
    private String ideas;
    private String telefono;
    private String imagen;
    private String estado;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime fechaSolicitud;

    // Constructor vacío (necesario para Jackson)
    public Solicitud() {}

    // Constructor completo (útil para pruebas)
    public Solicitud(int id, int idUsuario, String nombre, String tipoEvento,
                     LocalDate fechaEventoDeseada, String salonDeseado, String ideas,
                     String telefono, String imagen, String estado, LocalDateTime fechaSolicitud) {
        this.id = id;
        this.idUsuario = idUsuario;
        this.nombre = nombre;
        this.tipoEvento = tipoEvento;
        this.fechaEventoDeseada = fechaEventoDeseada;
        this.salonDeseado = salonDeseado;
        this.ideas = ideas;
        this.telefono = telefono;
        this.imagen = imagen;
        this.estado = estado;
        this.fechaSolicitud = fechaSolicitud;
    }

    // Getters y Setters (Jackson los necesita para serializar a JSON)
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }

    public int getIdUsuario() { return idUsuario; }
    public void setIdUsuario(int idUsuario) { this.idUsuario = idUsuario; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTipoEvento() { return tipoEvento; }
    public void setTipoEvento(String tipoEvento) { this.tipoEvento = tipoEvento; }

    public LocalDate getFechaEventoDeseada() { return fechaEventoDeseada; }
    public void setFechaEventoDeseada(LocalDate fechaEventoDeseada) { this.fechaEventoDeseada = fechaEventoDeseada; }

    public String getSalonDeseado() { return salonDeseado; }
    public void setSalonDeseado(String salonDeseado) { this.salonDeseado = salonDeseado; }

    public String getIdeas() { return ideas; }
    public void setIdeas(String ideas) { this.ideas = ideas; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public LocalDateTime getFechaSolicitud() { return fechaSolicitud; }
    public void setFechaSolicitud(LocalDateTime fechaSolicitud) { this.fechaSolicitud = fechaSolicitud; }

    @Override
    public String toString() {
        return "Solicitud{" +
                "id=" + id +
                ", idUsuario=" + idUsuario +
                ", nombre='" + nombre + '\'' +
                ", tipoEvento='" + tipoEvento + '\'' +
                ", fechaEventoDeseada=" + fechaEventoDeseada +
                ", estado='" + estado + '\'' +
                '}';
    }
}