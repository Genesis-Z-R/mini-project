package com.estudy.backend.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "friendships")
public class Friendship {

    @Id
    private String id;
    private String senderId;
    private String receiverId;
    private String status; // 'pending' or 'accepted'

    public Friendship() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
