package com.estudy.backend.controllers;

import com.estudy.backend.entities.Quiz;
import com.estudy.backend.repositories.QuizRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@CrossOrigin(origins = "*")
public class QuizController {

    private final QuizRepository quizRepository;

    public QuizController(QuizRepository quizRepository) {
        this.quizRepository = quizRepository;
    }

    @GetMapping
    public ResponseEntity<List<Quiz>> getQuizzes(@RequestParam String userId) {
        return ResponseEntity.ok(quizRepository.findByUserId(userId));
    }

    @PostMapping
    public ResponseEntity<Quiz> addQuiz(@RequestBody Quiz quiz) {
        return ResponseEntity.ok(quizRepository.save(quiz));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Quiz> updateQuiz(@PathVariable String id, @RequestBody Quiz quiz) {
        quiz.setId(id);
        return ResponseEntity.ok(quizRepository.save(quiz));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteQuiz(@PathVariable String id) {
        quizRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
