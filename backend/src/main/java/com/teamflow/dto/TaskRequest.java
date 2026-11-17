package com.teamflow.dto;

import jakarta.validation.constraints.NotBlank;

public record TaskRequest(
        @NotBlank String title,
        String description,
        String status,
        String priority,
        Long assigneeId,
        String dueDate
) {
}
