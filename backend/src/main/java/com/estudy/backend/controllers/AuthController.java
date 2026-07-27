package com.estudy.backend.controllers;

import com.estudy.backend.dto.AuthRequest;
import com.estudy.backend.dto.AuthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        String token = "jwt_token_" + UUID.randomUUID();
        Map<String, Object> user = Map.of(
            "email", request.getEmail().toLowerCase(),
            "id", request.getEmail().toLowerCase()
        );
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody AuthRequest request) {
        String token = "jwt_token_" + UUID.randomUUID();
        Map<String, Object> user = Map.of(
            "email", request.getEmail().toLowerCase(),
            "id", request.getEmail().toLowerCase()
        );
        return ResponseEntity.ok(new AuthResponse(token, user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        return ResponseEntity.noContent().build();
    }
}
