package com.teamflow.controller;

import com.teamflow.common.ApiResponse;
import com.teamflow.entity.User;
import com.teamflow.repository.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ApiResponse<List<User>> list() {
        return ApiResponse.ok(userRepository.findAll());
    }
}
