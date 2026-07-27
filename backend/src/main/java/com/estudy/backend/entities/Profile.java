package com.estudy.backend.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "profiles")
public class Profile {

    @Id
    private String id;
    private String email;
    private String name;
    private String indexNumber;
    private String reference;
    private String year;
    private String gender;
    private Boolean notificationsEnabled = true;
    private Boolean isPublic = true;
    private Boolean dailyDigestEnabled = true;

    public Profile() {}

    public Profile(String id, String email, String name) {
        this.id = id;
        this.email = email;
        this.name = name;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getIndexNumber() { return indexNumber; }
    public void setIndexNumber(String indexNumber) { this.indexNumber = indexNumber; }

    public String getReference() { return reference; }
    public void setReference(String reference) { this.reference = reference; }

    public String getYear() { return year; }
    public void setYear(String year) { this.year = year; }

    public String getGender() { return gender; }
    public void setGender(String gender) { this.gender = gender; }

    public Boolean getNotificationsEnabled() { return notificationsEnabled; }
    public void setNotificationsEnabled(Boolean notificationsEnabled) { this.notificationsEnabled = notificationsEnabled; }

    public Boolean getIsPublic() { return isPublic; }
    public void setIsPublic(Boolean isPublic) { this.isPublic = isPublic; }

    public Boolean getDailyDigestEnabled() { return dailyDigestEnabled; }
    public void setDailyDigestEnabled(Boolean dailyDigestEnabled) { this.dailyDigestEnabled = dailyDigestEnabled; }
}
