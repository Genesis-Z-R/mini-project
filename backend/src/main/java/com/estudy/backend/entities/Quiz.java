package com.estudy.backend.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "quizzes")
public class Quiz {

    @Id
    private String id;
    private String courseId;
    private String courseName;
    private String title;
    private Integer questionCount = 0;
    private String type;
    
    @Column(columnDefinition = "TEXT")
    private String questionsJson;
    private String userId;

    public Quiz() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getCourseName() { return courseName; }
    public void setCourseName(String courseName) { this.courseName = courseName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public Integer getQuestionCount() { return questionCount; }
    public void setQuestionCount(Integer questionCount) { this.questionCount = questionCount; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getQuestionsJson() { return questionsJson; }
    public void setQuestionsJson(String questionsJson) { this.questionsJson = questionsJson; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
