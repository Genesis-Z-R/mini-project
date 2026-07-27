package com.estudy.backend.controllers;

import com.estudy.backend.entities.QuizAttempt;
import com.estudy.backend.repositories.QuizAttemptRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quiz-attempts")
@CrossOrigin(origins = "*")
public class QuizAttemptController {

    private final QuizAttemptRepository quizAttemptRepository;

    public QuizAttemptController(QuizAttemptRepository quizAttemptRepository) {
        this.quizAttemptRepository = quizAttemptRepository;
    }

    @GetMapping
    public ResponseEntity<List<QuizAttempt>> getQuizAttempts(@RequestParam String userId) {
        return ResponseEntity.ok(quizAttemptRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<QuizAttempt> saveQuizAttempt(@RequestBody QuizAttempt attempt) {
        return ResponseEntity.ok(quizAttemptRepository.save(attempt));
    }
}
