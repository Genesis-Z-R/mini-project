package com.estudy.backend.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "courses")
public class Course {

    @Id
    private String id;
    private String name;
    private String code;
    private String room;
    private String userId;

    public Course() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
}
