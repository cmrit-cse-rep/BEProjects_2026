package com.example.smart_ev.Modals;

import com.google.gson.annotations.Expose;
import com.google.gson.annotations.SerializedName;

public class LoginModal {

    @SerializedName("data")
    @Expose
    private User data;

    @SerializedName("status")
    @Expose
    private String status;

    @SerializedName("message")
    @Expose
    private String message;

    public LoginModal(User data, String status, String message) {
        this.data = data;
        this.status = status;
        this.message = message;
    }

    public User getData() {
        return data;
    }

    public void setData(User data) {
        this.data = data;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
