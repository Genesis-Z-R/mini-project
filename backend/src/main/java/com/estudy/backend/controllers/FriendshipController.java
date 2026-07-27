package com.estudy.backend.entities;

import com.estudy.backend.repositories.FriendshipRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friendships")
@CrossOrigin(origins = "*")
public class FriendshipController {

    private final FriendshipRepository friendshipRepository;

    public FriendshipController(FriendshipRepository friendshipRepository) {
        this.friendshipRepository = friendshipRepository;
    }

    @GetMapping
    public ResponseEntity<List<Friendship>> getFriendships(@RequestParam String userId) {
        return ResponseEntity.ok(friendshipRepository.findBySenderIdOrReceiverId(userId, userId));
    }

    @PostMapping
    public ResponseEntity<Friendship> sendFriendRequest(@RequestBody Friendship friendship) {
        return ResponseEntity.ok(friendshipRepository.save(friendship));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<Friendship> acceptFriendRequest(@PathVariable String id) {
        return friendshipRepository.findById(id).map(f -> {
            f.setStatus("accepted");
            return ResponseEntity.ok(friendshipRepository.save(f));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeFriendship(@PathVariable String id) {
        friendshipRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
