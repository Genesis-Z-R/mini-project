package com.estudy.backend.repositories;

import com.estudy.backend.entities.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, String> {
    List<Schedule> findByUserId(String userId);
}
