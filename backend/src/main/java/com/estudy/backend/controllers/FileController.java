package com.estudy.backend.controllers;

import com.estudy.backend.entities.FileMetadata;
import com.estudy.backend.repositories.FileMetadataRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    private final FileMetadataRepository fileMetadataRepository;

    public FileController(FileMetadataRepository fileMetadataRepository) {
        this.fileMetadataRepository = fileMetadataRepository;
    }

    @GetMapping
    public ResponseEntity<List<FileMetadata>> getFiles(@RequestParam String userId) {
        return ResponseEntity.ok(fileMetadataRepository.findByUserId(userId));
    }

    @GetMapping("/public")
    public ResponseEntity<List<FileMetadata>> getPeerPublicFiles(@RequestParam String userId) {
        return ResponseEntity.ok(fileMetadataRepository.findByUserIdAndIsPublic(userId, true));
    }

    @GetMapping("/search")
    public ResponseEntity<List<FileMetadata>> searchPublicFiles(@RequestParam String query) {
        return ResponseEntity.ok(fileMetadataRepository.findByIsPublicTrueAndTitleContainingIgnoreCase(query));
    }

    @PostMapping
    public ResponseEntity<FileMetadata> uploadFileMetadata(@RequestBody FileMetadata fileMetadata) {
        return ResponseEntity.ok(fileMetadataRepository.save(fileMetadata));
    }

    @PostMapping("/copy")
    public ResponseEntity<FileMetadata> copyPublicFile(@RequestBody FileMetadata fileMetadata) {
        return ResponseEntity.ok(fileMetadataRepository.save(fileMetadata));
    }

    @PatchMapping("/{id}/visibility")
    public ResponseEntity<FileMetadata> toggleVisibility(@PathVariable String id, @RequestBody Map<String, Boolean> body) {
        return fileMetadataRepository.findById(id).map(file -> {
            file.setIsPublic(body.getOrDefault("isPublic", true));
            return ResponseEntity.ok(fileMetadataRepository.save(file));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFile(@PathVariable String id) {
        fileMetadataRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
