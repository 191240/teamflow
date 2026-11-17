package com.teamflow.service;

import com.teamflow.common.CurrentUser;
import com.teamflow.dto.ProjectRequest;
import com.teamflow.entity.Project;
import com.teamflow.entity.User;
import com.teamflow.repository.ActivityRepository;
import com.teamflow.repository.CommentRepository;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final CommentRepository commentRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;

    public ProjectService(ProjectRepository projectRepository,
                          TaskRepository taskRepository,
                          CommentRepository commentRepository,
                          ActivityRepository activityRepository,
                          UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.commentRepository = commentRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
    }

    public List<Project> list() {
        return projectRepository.findAll();
    }

    public Project get(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "项目不存在"));
    }

    @Transactional
    public Project create(ProjectRequest request) {
        User current = CurrentUser.entity(userRepository);
        Project project = new Project();
        project.setName(request.name());
        project.setDescription(request.description());
        project.setColor(request.color() == null || request.color().isBlank() ? "#6366f1" : request.color());
        if (current != null) {
            project.setOwnerId(current.getId());
        }
        return projectRepository.save(project);
    }

    @Transactional
    public void delete(Long id) {
        get(id);
        List<Long> taskIds = taskRepository.findByProjectIdOrderByPositionAsc(id).stream().map(t -> t.getId()).toList();
        for (Long taskId : taskIds) {
            commentRepository.deleteByTaskId(taskId);
        }
        taskRepository.deleteByProjectId(id);
        activityRepository.deleteByProjectId(id);
        projectRepository.deleteById(id);
    }
}
