package com.teamflow.controller;

import com.teamflow.common.ApiResponse;
import com.teamflow.dto.CommentRequest;
import com.teamflow.dto.TaskMoveRequest;
import com.teamflow.dto.TaskRequest;
import com.teamflow.entity.Comment;
import com.teamflow.entity.Task;
import com.teamflow.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class TaskController {
    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/api/projects/{projectId}/tasks")
    public ApiResponse<List<Task>> list(@PathVariable Long projectId) {
        return ApiResponse.ok(taskService.list(projectId));
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    public ApiResponse<Task> create(@PathVariable Long projectId, @Valid @RequestBody TaskRequest request) {
        return ApiResponse.ok(taskService.create(projectId, request));
    }

    @PutMapping("/api/tasks/{id}")
    public ApiResponse<Task> update(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return ApiResponse.ok(taskService.update(id, request));
    }

    @PatchMapping("/api/tasks/{id}/move")
    public ApiResponse<Task> move(@PathVariable Long id, @Valid @RequestBody TaskMoveRequest request) {
        return ApiResponse.ok(taskService.move(id, request));
    }

    @DeleteMapping("/api/tasks/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        taskService.delete(id);
        return ApiResponse.ok(null);
    }

    @GetMapping("/api/tasks/{id}/comments")
    public ApiResponse<List<Comment>> comments(@PathVariable Long id) {
        return ApiResponse.ok(taskService.comments(id));
    }

    @PostMapping("/api/tasks/{id}/comments")
    public ApiResponse<Comment> addComment(@PathVariable Long id, @Valid @RequestBody CommentRequest request) {
        return ApiResponse.ok(taskService.addComment(id, request));
    }
}
