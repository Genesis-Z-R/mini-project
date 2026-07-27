package com.estudy.backend.controllers;

import com.estudy.backend.entities.Schedule;
import com.estudy.backend.repositories.ScheduleRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/schedule")
@CrossOrigin(origins = "*")
public class ScheduleController {

    private final ScheduleRepository scheduleRepository;

    public ScheduleController(ScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    @GetMapping
    public ResponseEntity<List<Schedule>> getSchedule(@RequestParam String userId) {
        return ResponseEntity.ok(scheduleRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<Schedule> addScheduleItem(@RequestBody Schedule item) {
        return ResponseEntity.ok(scheduleRepository.save(item));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Schedule> updateScheduleItem(@PathVariable String id, @RequestBody Schedule item) {
        item.setId(id);
        return ResponseEntity.ok(scheduleRepository.save(item));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeScheduleItem(@PathVariable String id) {
        scheduleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
