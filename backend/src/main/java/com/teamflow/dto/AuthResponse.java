package com.teamflow.dto;

public record AuthResponse(
        String token,
        String username,
        String displayName,
        String role
) {
}
