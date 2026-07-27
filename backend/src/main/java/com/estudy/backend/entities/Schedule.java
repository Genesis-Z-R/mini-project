package com.estudy.backend.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "schedule")
public class Schedule {

    @Id
    private String id;
    private String courseId;
    private String name;
    private String day;
    private String startTime;
    private String endTime;
    private String room;
    private Boolean isRepeating = true;
    private String repeatFrequency = "weekly";
    private Boolean isClass = true;
    private String userId;

    public Schedule() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDay() { return day; }
    public void setDay(String day) { this.day = day; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public Boolean getIsRepeating() { return isRepeating; }
    public void setIsRepeating(Boolean isRepeating) { this.isRepeating = isRepeating; }

    public String getRepeatFrequency() { return repeatFrequency; }
    public void setRepeatFrequency(String repeatFrequency) { this.repeatFrequency = repeatFrequency; }

    public Boolean getIsClass() { return isClass; }
    public void setIsClass(Boolean isClass) { this.isClass = isClass; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
