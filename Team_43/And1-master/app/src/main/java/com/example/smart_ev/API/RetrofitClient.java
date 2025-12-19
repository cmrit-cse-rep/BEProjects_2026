package com.example.smart_ev.API;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class RetrofitClient {

    public static final String BASE_URL ="http://192.168.0.98:8000/";


    private static RetrofitClient retrofitClient;
    private static Retrofit retrofit;

    private OkHttpClient.Builder builder = new OkHttpClient.Builder();
    private HttpLoggingInterceptor interceptor = new HttpLoggingInterceptor();

    private RetrofitClient() {
        // Set custom timeout values
        builder.connectTimeout(30, TimeUnit.SECONDS); // Connection timeout
        builder.readTimeout(30, TimeUnit.SECONDS);    // Read timeout

        Gson gson = new GsonBuilder().setLenient().create();
        interceptor.level(HttpLoggingInterceptor.Level.BODY);
        builder.addInterceptor(interceptor);

        retrofit = new Retrofit.Builder().baseUrl(BASE_URL)
                .addConverterFactory(GsonConverterFactory.create()).client(builder.build()).build();
    }

    public static synchronized RetrofitClient getInstance() {
        if(retrofitClient == null) {
            retrofitClient = new RetrofitClient();
        }
        return retrofitClient;
    }

    public Api getApi() {
        return retrofit.create(Api.class);
    }
}
