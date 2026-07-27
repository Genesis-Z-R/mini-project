package com.estudy.backend.controllers;

import com.estudy.backend.entities.Course;
import com.estudy.backend.repositories.CourseRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@CrossOrigin(origins = "*")
public class CourseController {

    private final CourseRepository courseRepository;

    public CourseController(CourseRepository courseRepository) {
        this.courseRepository = courseRepository;
    }

    @GetMapping
    public ResponseEntity<List<Course>> getCourses(@RequestParam String userId) {
        return ResponseEntity.ok(courseRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<Course> addCourse(@RequestBody Course course) {
        return ResponseEntity.ok(courseRepository.save(course));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCourse(@PathVariable String id) {
        courseRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
