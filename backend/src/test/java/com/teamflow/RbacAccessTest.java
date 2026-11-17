package com.teamflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.teamflow.enums.Role;
import com.teamflow.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RbacAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void memberCannotCreateProject() throws Exception {
        String token = login("rbac_member", Role.MEMBER);
        mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"成员越权项目\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void memberCannotDeleteTaskOrProject() throws Exception {
        String token = login("rbac_member2", Role.MEMBER);
        mockMvc.perform(delete("/api/tasks/9999").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/projects/9999").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanCreateAndDeleteProject() throws Exception {
        String token = loginWithPassword("admin", "admin123");
        MvcResult created = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"RBAC 临时项目\"}"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode data = objectMapper.readTree(created.getResponse().getContentAsString()).get("data");
        long id = data.get("id").asLong();

        mockMvc.perform(delete("/api/projects/" + id).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    private String login(String username, Role role) throws Exception {
        if (role != null && userRepository.findByUsername(username).isEmpty()) {
            var user = new com.teamflow.entity.User();
            user.setUsername(username);
            user.setPassword(passwordEncoder.encode("pass123"));
            user.setDisplayName(username);
            user.setRole(role);
            userRepository.save(user);
        }
        return loginWithPassword(username, "pass123");
    }

    private String loginWithPassword(String username, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("token").asText();
    }
}
