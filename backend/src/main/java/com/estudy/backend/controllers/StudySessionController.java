package com.estudy.backend.controllers;

import com.estudy.backend.entities.StudySession;
import com.estudy.backend.repositories.StudySessionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/study-sessions")
@CrossOrigin(origins = "*")
public class StudySessionController {

    private final StudySessionRepository studySessionRepository;

    public StudySessionController(StudySessionRepository studySessionRepository) {
        this.studySessionRepository = studySessionRepository;
    }

    @GetMapping
    public ResponseEntity<List<StudySession>> getStudySessions(@RequestParam String userId) {
        return ResponseEntity.ok(studySessionRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<StudySession> saveStudySession(@RequestBody StudySession session) {
        return ResponseEntity.ok(studySessionRepository.save(session));
    }
}
