package com.estudy.backend.entities;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, String> {
    List<Friendship> findBySenderIdOrReceiverId(String senderId, String receiverId);
}
