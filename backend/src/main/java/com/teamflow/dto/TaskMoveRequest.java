package com.teamflow.dto;

import jakarta.validation.constraints.NotBlank;

public record TaskMoveRequest(
        @NotBlank String status,
        Integer position
) {
}
