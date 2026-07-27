package com.estudy.backend.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "files")
public class FileMetadata {

    @Id
    private String id;
    private String title;
    private String courseId;
    private String fileType;
    private String size;
    private Integer downloads = 0;
    private Boolean isPublic = true;
    private String uploadDate;
    private String userId;
    private String url;

    public FileMetadata() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCourseId() { return courseId; }
    public void setCourseId(String courseId) { this.courseId = courseId; }

    public String getFileType() { return fileType; }
    public void setFileType(String fileType) { this.fileType = fileType; }

    public String getSize() { return size; }
    public void setSize(String size) { this.size = size; }

    public Integer getDownloads() { return downloads; }
    public void setDownloads(Integer downloads) { this.downloads = downloads; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }

    public String getUploadDate() { return uploadDate; }
    public void setUploadDate(String uploadDate) { this.uploadDate = uploadDate; }

    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}
