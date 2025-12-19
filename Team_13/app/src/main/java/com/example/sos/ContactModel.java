package com.example.sos;

public class ContactModel {
    String id, name, number, fcmToken;

    public ContactModel(String id, String name, String number) {
        this.id = id;
        this.name = name;
        this.number = number;
        this.fcmToken = "";
    }

    public ContactModel(String id, String name, String number, String fcmToken) {
        this.id = id;
        this.name = name;
        this.number = number;
        this.fcmToken = fcmToken;
    }

    public ContactModel() {
        this.fcmToken = "";
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNumber() {
        return number;
    }

    public void setNumber(String number) {
        this.number = number;
    }

    public String getFcmToken() {
        return fcmToken;
    }

    public void setFcmToken(String fcmToken) {
        this.fcmToken = fcmToken;
    }
}