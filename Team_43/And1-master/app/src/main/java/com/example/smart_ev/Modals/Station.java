package com.example.smart_ev.Modals;

public class Station {
    private int id;
    private String name, contact, email, latitude, longitude, address, image, is_enabled, created_date, updated_date;

    public Station(int id, String name, String contact, String email, String latitude, String longitude, String address, String image, String is_enabled, String created_date, String updated_date) {
        this.id = id;
        this.name = name;
        this.contact = contact;
        this.email = email;
        this.latitude = latitude;
        this.longitude = longitude;
        this.address = address;
        this.image = image;
        this.is_enabled = is_enabled;
        this.created_date = created_date;
        this.updated_date = updated_date;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getContact() {
        return contact;
    }

    public String getEmail() {
        return email;
    }

    public String getLatitude() {
        return latitude;
    }

    public String getLongitude() {
        return longitude;
    }

    public String getAddress() {
        return address;
    }

    public String getImage() {
        return image;
    }

    public String getIs_enabled() {
        return is_enabled;
    }

    public String getCreated_date() {
        return created_date;
    }

    public String getUpdated_date() {
        return updated_date;
    }
}
