package com.teamflow.service;

import com.teamflow.entity.Task;
import com.teamflow.enums.TaskStatus;
import com.teamflow.repository.ActivityRepository;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class DashboardService {
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ActivityRepository activityRepository;

    public DashboardService(ProjectRepository projectRepository,
                            TaskRepository taskRepository,
                            UserRepository userRepository,
                            ActivityRepository activityRepository) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.activityRepository = activityRepository;
    }

    public Map<String, Object> overview() {
        Map<String, Long> byStatus = new LinkedHashMap<>();
        for (TaskStatus status : TaskStatus.values()) {
            byStatus.put(status.name(), 0L);
        }
        for (Task task : taskRepository.findAll()) {
            byStatus.merge(task.getStatus().name(), 1L, Long::sum);
        }

        long totalTasks = taskRepository.count();
        long done = byStatus.getOrDefault(TaskStatus.DONE.name(), 0L);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("totalProjects", projectRepository.count());
        data.put("totalTasks", totalTasks);
        data.put("totalUsers", userRepository.count());
        data.put("completionRate", totalTasks == 0 ? 0 : Math.round(done * 100.0 / totalTasks));
        data.put("tasksByStatus", byStatus);
        data.put("recentActivities", activityRepository.findTop10ByOrderByCreatedAtDesc());
        return data;
    }
}
