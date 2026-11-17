package com.teamflow.common;

import com.teamflow.entity.User;
import com.teamflow.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class CurrentUser {
    private CurrentUser() {}

    public static String username() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth == null ? null : auth.getName();
    }

    public static User entity(UserRepository userRepository) {
        String username = username();
        if (username == null) {
            return null;
        }
        return userRepository.findByUsername(username).orElse(null);
    }
}
