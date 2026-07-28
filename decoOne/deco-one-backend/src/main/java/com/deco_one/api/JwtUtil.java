package com.deco_one.api;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * Utilidad para generar y validar tokens JWT del sistema DECO_ONE.
 * El token contiene el id del usuario (subject), su rol y una fecha de expiración.
 */
public class JwtUtil {

    // Clave secreta usada para firmar los tokens (HMAC-SHA256, 256 bits).
    // En un entorno productivo real esto debería venir de una variable de entorno,
    // no estar embebido en el código fuente.
    private static final SecretKey LLAVE_SECRETA = Keys.hmacShaKeyFor(
            "DecoOneSuperSecretKeyParaFirmarTokensJWT2026!!".getBytes(StandardCharsets.UTF_8)
    );

    private static final long EXPIRACION_MS = 2 * 60 * 60 * 1000; // 2 horas

    /**
     * Genera un token JWT firmado que contiene el id del usuario y su rol.
     */
    public static String generarToken(int idUsuario, String rol) {
        Date ahora = new Date();
        Date expiracion = new Date(ahora.getTime() + EXPIRACION_MS);

        return Jwts.builder()
                .subject(String.valueOf(idUsuario))
                .claim("rol", rol)
                .issuedAt(ahora)
                .expiration(expiracion)
                .signWith(LLAVE_SECRETA)
                .compact();
    }

    /**
     * Valida la firma y la expiración del token y retorna sus claims.
     * Lanza una excepción de io.jsonwebtoken (JwtException) si el token es
     * inválido, está alterado o venció.
     */
    public static Claims validarToken(String token) {
        return Jwts.parser()
                .verifyWith(LLAVE_SECRETA)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
