package com.teamflow;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class TaskBoardTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void memberCanCreateTaskAndCommentAndMove() throws Exception {
        String token = login("member");

        MvcResult projectResult = mockMvc.perform(post("/api/projects")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"临时项目\"}"))
                .andReturn();
        assertThat(projectResult.getResponse().getStatus()).isEqualTo(403);

        MvcResult created = mockMvc.perform(post("/api/projects/1/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"成员新建任务\",\"priority\":\"HIGH\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("TODO"))
                .andReturn();
        long taskId = objectMapper.readTree(created.getResponse().getContentAsString()).get("data").get("id").asLong();

        mockMvc.perform(post("/api/tasks/" + taskId + "/comments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"测试评论\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value("测试评论"));

        mockMvc.perform(get("/api/tasks/" + taskId + "/comments").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].content").value("测试评论"));

        mockMvc.perform(patch("/api/tasks/" + taskId + "/move")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"IN_PROGRESS\",\"position\":0}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"));
    }

    @Test
    void moveRenumbersPositionsWithoutDuplicates() throws Exception {
        String token = login("admin");
        MvcResult created = mockMvc.perform(post("/api/projects/1/tasks")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"重排测试任务\"}"))
                .andExpect(status().isOk())
                .andReturn();
        long taskId = objectMapper.readTree(created.getResponse().getContentAsString()).get("data").get("id").asLong();

        mockMvc.perform(patch("/api/tasks/" + taskId + "/move")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"TODO\",\"position\":0}"))
                .andExpect(status().isOk());

        MvcResult list = mockMvc.perform(get("/api/projects/1/tasks").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode tasks = objectMapper.readTree(list.getResponse().getContentAsString()).get("data");
        java.util.Set<Integer> todoPositions = new java.util.HashSet<>();
        for (JsonNode task : tasks) {
            if ("TODO".equals(task.get("status").asText())) {
                assertThat(todoPositions.add(task.get("position").asInt()))
                        .as("TODO 列 position 不应重复")
                        .isTrue();
            }
        }
    }

    @Test
    void dashboardOverviewReturnsStatistics() throws Exception {
        String token = login("admin");
        mockMvc.perform(get("/api/dashboard/overview").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalProjects").isNumber())
                .andExpect(jsonPath("$.data.totalTasks").isNumber())
                .andExpect(jsonPath("$.data.completionRate").isNumber())
                .andExpect(jsonPath("$.data.tasksByStatus.TODO").isNumber());
    }

    private String login(String username) throws Exception {
        String password = username.equals("admin") ? "admin123" : "member123";
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"" + username + "\",\"password\":\"" + password + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data").get("token").asText();
    }
}
