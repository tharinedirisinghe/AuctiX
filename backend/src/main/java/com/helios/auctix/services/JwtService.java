package com.helios.auctix.services;

import com.helios.auctix.domain.user.UserRoleEnum;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Date;
import java.util.function.Function;

@Slf4j
@Service
public class JwtService {
    private final Environment environment;
    private String base64EncodedSecretKey = "";

    public JwtService(Environment environment, @Value("${jwt.secret.key:}") String jwtSecret) {
        this.environment = environment;
        try {
            if (jwtSecret != null && !jwtSecret.isBlank()) {
                log.info("Using secret key from environment variable.");
                base64EncodedSecretKey = Base64.getEncoder().encodeToString(jwtSecret.getBytes(StandardCharsets.UTF_8));
            } else if (isDevProfileActive()) {
                log.warn("Using hardcoded secret key for dev profile.");
                String devSecret = "SecretKeyForTestingOnly123_NOT_FOR_PROD!";
                base64EncodedSecretKey = Base64.getEncoder().encodeToString(devSecret.getBytes(StandardCharsets.UTF_8));
            } else {
                log.info("No secret key found; generating new key.");
                SecretKey key = Jwts.SIG.HS256.key().build();
                base64EncodedSecretKey = Base64.getEncoder().encodeToString(key.getEncoded());
            }
        } catch (Exception e) {
            log.error("Error while generating secret key{}", e.getMessage());
            throw new RuntimeException();
        }
    }

    public String generateToken(String email, UserRoleEnum role) {

        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 6)) // 6 hours
                .signWith(getKey())  // Algorithm will be automatically selected based on the key type
                                    // https://github.com/jwtk/jjwt?tab=readme-ov-file#signing-key

                .compact();

    }

    private SecretKey getKey() {
        byte[] keyBytes = Decoders.BASE64.decode(base64EncodedSecretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public UserRoleEnum extractRole(String token) {
        return UserRoleEnum.valueOf(extractClaim(token, claims -> claims.get("role", String.class)));
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimResolver) {
        final Claims claims = extractClaims(token);
        return claimResolver.apply(claims);
    }

    private Claims extractClaims(String token) {
        Claims claims;

        try {
            claims = Jwts.parser()
                    .verifyWith(getKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (SignatureException e) {
            log.warn("Error while parsing claims: {}", e.getMessage());
            throw e;
        } catch (ExpiredJwtException e) {
            // no need to log, rethrow so filter can handle
            throw e;
        } catch (Exception e) {
            log.error("Error while parsing jwt claims: {}", e.getMessage());
            throw e;
        }

        return claims;
    }

    public boolean isValidToken(String token, UserDetails userDetails) {
        final String userName = extractEmail(token);
        return (userName.equals(userDetails.getUsername()) && !isTokenExpired(token));
    }

    public boolean isValidToken(String token) {
        final String userName = extractEmail(token);
        log.info("Username: {} isTokenExpired: {}", userName, isTokenExpired(token));
        return !isTokenExpired(token);
    }
    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private boolean isDevProfileActive() {
        for (String profile : environment.getActiveProfiles()) {
            if ("dev".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        return false;
    }
}
