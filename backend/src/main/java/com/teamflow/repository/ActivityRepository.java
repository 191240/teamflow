package com.teamflow.repository;

import com.teamflow.entity.Activity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ActivityRepository extends JpaRepository<Activity, Long> {
    List<Activity> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    List<Activity> findTop10ByOrderByCreatedAtDesc();

    void deleteByProjectId(Long projectId);
}
