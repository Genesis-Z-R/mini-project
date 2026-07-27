package com.estudy.backend.controllers;

import com.estudy.backend.entities.Profile;
import com.estudy.backend.repositories.ProfileRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
@CrossOrigin(origins = "*")
public class ProfileController {

    private final ProfileRepository profileRepository;

    public ProfileController(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @GetMapping
    public ResponseEntity<List<Profile>> getAllProfiles() {
        return ResponseEntity.ok(profileRepository.findAll());
    }

    @GetMapping("/{email}")
    public ResponseEntity<Profile> getProfile(@PathVariable String email) {
        return profileRepository.findByEmail(email)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(new Profile(email, email, email.split("@")[0])));
    }

    @PutMapping("/{email}")
    public ResponseEntity<Profile> updateProfile(@PathVariable String email, @RequestBody Profile profile) {
        profile.setId(email);
        profile.setEmail(email);
        return ResponseEntity.ok(profileRepository.save(profile));
    }

    @PostMapping("/seed")
    public ResponseEntity<Void> seedProfile(@RequestBody Profile profile) {
        if (!profileRepository.existsById(profile.getEmail())) {
            profile.setId(profile.getEmail());
            profileRepository.save(profile);
        }
        return ResponseEntity.ok().build();
    }
}
