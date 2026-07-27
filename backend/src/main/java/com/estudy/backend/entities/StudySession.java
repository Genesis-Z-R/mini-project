package com.estudy.backend.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "study_sessions")
public class StudySession {

    @Id
    private String id;
    private Integer durationMinutes;
    private String date;
    private String startTime;
    private String endTime;
    private String userId;

    public StudySession() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Integer getDurationMinutes() { return durationMinutes; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
