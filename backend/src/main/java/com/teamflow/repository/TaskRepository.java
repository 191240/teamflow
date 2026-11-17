package com.teamflow.repository;

import com.teamflow.entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectIdOrderByPositionAsc(Long projectId);

    long countByProjectId(Long projectId);

    void deleteByProjectId(Long projectId);
}
