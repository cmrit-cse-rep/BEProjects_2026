package com.example.smart_ev.API;

import com.example.smart_ev.Modals.LoginModal;
import com.example.smart_ev.Modals.RegistrationModal;
import com.example.smart_ev.Modals.Station;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.Field;
import retrofit2.http.FormUrlEncoded;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Query;

public interface Api {
    @FormUrlEncoded
    @POST("api/save_user/")
    Call<RegistrationModal> save_user(
            @Field("name") String name,
            @Field("contact") String contact,
            @Field("email") String email,
            @Field("password") String password,
            @Field("address") String address);

    @FormUrlEncoded
    @POST("api/user_login/")
    Call<LoginModal> login(
            @Field("contact") String contact,
            @Field("password") String password);

    @GET("api/get_stations/")
    Call<List<Station>> get_stations();

    @FormUrlEncoded
    @POST("api/save_vehical/")
    Call<RegistrationModal> save_vehical(
            @Field("user_id") String user_id,
            @Field("company") String company,
            @Field("model") String model,
            @Field("reg") String reg,
            @Field("chassi") String chassi,
            @Field("engine") String engine,
            @Field("battery") String battery);

}
