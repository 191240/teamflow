package com.teamflow.service;

import com.teamflow.common.CurrentUser;
import com.teamflow.dto.CommentRequest;
import com.teamflow.dto.TaskMoveRequest;
import com.teamflow.dto.TaskRequest;
import com.teamflow.entity.Activity;
import com.teamflow.entity.Comment;
import com.teamflow.entity.Task;
import com.teamflow.entity.User;
import com.teamflow.enums.TaskPriority;
import com.teamflow.enums.TaskStatus;
import com.teamflow.repository.ActivityRepository;
import com.teamflow.repository.CommentRepository;
import com.teamflow.repository.ProjectRepository;
import com.teamflow.repository.TaskRepository;
import com.teamflow.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final CommentRepository commentRepository;
    private final ActivityRepository activityRepository;
    private final UserRepository userRepository;
    private final WebSocketNotifier notifier;

    public TaskService(TaskRepository taskRepository,
                       ProjectRepository projectRepository,
                       CommentRepository commentRepository,
                       ActivityRepository activityRepository,
                       UserRepository userRepository,
                       WebSocketNotifier notifier) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.commentRepository = commentRepository;
        this.activityRepository = activityRepository;
        this.userRepository = userRepository;
        this.notifier = notifier;
    }

    public List<Task> list(Long projectId) {
        return taskRepository.findByProjectIdOrderByPositionAsc(projectId);
    }

    public Task get(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "任务不存在"));
    }

    public List<Comment> comments(Long taskId) {
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId);
    }

    @Transactional
    public Task create(Long projectId, TaskRequest request) {
        if (!projectRepository.existsById(projectId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "项目不存在");
        }
        Task task = new Task();
        task.setProjectId(projectId);
        applyRequest(task, request);
        long columnCount = taskRepository.findByProjectIdOrderByPositionAsc(projectId).stream()
                .filter(t -> t.getStatus() == task.getStatus())
                .count();
        task.setPosition((int) columnCount);
        Task saved = taskRepository.save(task);
        logActivity(projectId, saved.getId(), "创建了任务「" + saved.getTitle() + "」");
        notifier.projectChanged(projectId, "task_created");
        return saved;
    }

    @Transactional
    public Task update(Long id, TaskRequest request) {
        Task task = get(id);
        applyRequest(task, request);
        Task saved = taskRepository.save(task);
        logActivity(saved.getProjectId(), saved.getId(), "更新了任务「" + saved.getTitle() + "」");
        notifier.projectChanged(saved.getProjectId(), "task_updated");
        return saved;
    }

    @Transactional
    public Task move(Long id, TaskMoveRequest request) {
        Task task = get(id);
        TaskStatus oldStatus = task.getStatus();
        TaskStatus newStatus = parseStatus(request.status(), oldStatus);
        Long projectId = task.getProjectId();

        List<Task> all = taskRepository.findByProjectIdOrderByPositionAsc(projectId);
        List<Task> destination = new ArrayList<>();
        for (Task other : all) {
            if (!other.getId().equals(id) && other.getStatus() == newStatus) {
                destination.add(other);
            }
        }

        int target = request.position() == null ? destination.size() : Math.max(0, Math.min(request.position(), destination.size()));
        destination.add(target, task);
        renumber(destination);

        if (oldStatus != newStatus) {
            List<Task> source = new ArrayList<>();
            for (Task other : all) {
                if (!other.getId().equals(id) && other.getStatus() == oldStatus) {
                    source.add(other);
                }
            }
            renumber(source);
        }

        task.setStatus(newStatus);
        task.setUpdatedAt(java.time.LocalDateTime.now());
        Task saved = taskRepository.save(task);
        logActivity(saved.getProjectId(), saved.getId(),
                "将任务「" + saved.getTitle() + "」移动到 " + saved.getStatus());
        notifier.projectChanged(saved.getProjectId(), "task_moved");
        return saved;
    }

    private void renumber(List<Task> tasks) {
        for (int i = 0; i < tasks.size(); i++) {
            Task task = tasks.get(i);
            if (task.getPosition() != i) {
                task.setPosition(i);
                taskRepository.save(task);
            }
        }
    }

    @Transactional
    public void delete(Long id) {
        Task task = get(id);
        Long projectId = task.getProjectId();
        commentRepository.deleteByTaskId(id);
        taskRepository.deleteById(id);
        logActivity(projectId, id, "删除了任务「" + task.getTitle() + "」");
        notifier.projectChanged(projectId, "task_deleted");
    }

    @Transactional
    public Comment addComment(Long taskId, CommentRequest request) {
        Task task = get(taskId);
        User current = CurrentUser.entity(userRepository);
        Comment comment = new Comment();
        comment.setTaskId(taskId);
        comment.setAuthorId(current == null ? 0L : current.getId());
        comment.setAuthorName(current == null ? "system" : current.getDisplayName());
        comment.setContent(request.content());
        Comment saved = commentRepository.save(comment);
        logActivity(task.getProjectId(), taskId, "评论了任务「" + task.getTitle() + "」");
        notifier.projectChanged(task.getProjectId(), "comment_added");
        return saved;
    }

    private void applyRequest(Task task, TaskRequest request) {
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(parseStatus(request.status(), task.getStatus()));
        task.setPriority(parsePriority(request.priority(), task.getPriority()));
        task.setDueDate(parseDate(request.dueDate()));
        if (request.assigneeId() != null) {
            userRepository.findById(request.assigneeId()).ifPresent(user -> {
                task.setAssigneeId(user.getId());
                task.setAssigneeName(user.getDisplayName());
            });
        } else {
            task.setAssigneeId(null);
            task.setAssigneeName(null);
        }
        task.setUpdatedAt(java.time.LocalDateTime.now());
    }

    private TaskStatus parseStatus(String value, TaskStatus fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return TaskStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return fallback;
        }
    }

    private TaskPriority parsePriority(String value, TaskPriority fallback) {
        if (value == null || value.isBlank()) return fallback;
        try {
            return TaskPriority.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            return fallback;
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDate.parse(value);
        } catch (Exception e) {
            return null;
        }
    }

    private void logActivity(Long projectId, Long taskId, String message) {
        Activity activity = new Activity();
        activity.setProjectId(projectId);
        activity.setTaskId(taskId);
        activity.setMessage(message);
        activityRepository.save(activity);
    }
}
