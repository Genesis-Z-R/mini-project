package com.estudy.backend.repositories;

import com.estudy.backend.entities.FileMetadata;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, String> {
    List<FileMetadata> findByUserId(String userId);
    List<FileMetadata> findByUserIdAndIsPublic(String userId, Boolean isPublic);
    List<FileMetadata> findByIsPublicTrueAndTitleContainingIgnoreCase(String title);
}
