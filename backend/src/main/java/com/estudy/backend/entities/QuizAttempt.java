package com.estudy.backend.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "quiz_attempts")
public class QuizAttempt {

    @Id
    private String id;
    private String quizId;
    private String userId;
    private Double score;
    private Double maxScore;
    private String attemptDate;

    public QuizAttempt() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getQuizId() { return quizId; }
    public void setQuizId(String quizId) { this.quizId = quizId; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public Double getScore() { return score; }
    public void setScore(Double score) { this.score = score; }

    public Double getMaxScore() { return maxScore; }
    public void setMaxScore(Double maxScore) { this.maxScore = maxScore; }

    public String getAttemptDate() { return attemptDate; }
    public void setAttemptDate(String attemptDate) { this.attemptDate = attemptDate; }
}
