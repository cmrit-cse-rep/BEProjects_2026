package com.example.smart_ev.SharedPreferenceManager;

import android.content.Context;
import android.content.SharedPreferences;

import com.example.smart_ev.Modals.User;

public class SharedPref {

    private static String SHARED_PREF_NAME = "vinayrao";
    private SharedPreferences preferences;
    Context context;
    private SharedPreferences.Editor editor;

    public SharedPref(Context context) {
        this.context = context;
    }

    public void saveUser(User user)
    {
        preferences = context.getSharedPreferences("SHARED_PREF_NAME", context.MODE_PRIVATE);
        editor = preferences.edit();
        editor.putInt("user_id", user.getId());
        editor.putString("user_name", user.getName());
        editor.putString("user_phone", user.getContact());
        editor.putString("user_email", user.getEmail());
        editor.putBoolean("loggedin", true);
        editor.apply();
    }

   public boolean isLoggedIn()
    {
        preferences = context.getSharedPreferences("SHARED_PREF_NAME", context.MODE_PRIVATE);
        if(preferences.getBoolean("loggedin", false))
        {
            return preferences.getBoolean("loggedin", false);
        }
        return false;
    }

   public User getUser()
    {
        preferences = context.getSharedPreferences("SHARED_PREF_NAME", context.MODE_PRIVATE);
        return new User(
                preferences.getInt("user_id", -1),
                preferences.getString("user_name", null),
                preferences.getString("user_phone", null),
                preferences.getString("user_email", null));
    }

    public void userLogOut()
    {
        preferences = context.getSharedPreferences("SHARED_PREF_NAME", context.MODE_PRIVATE);
        editor = preferences.edit();
        editor.clear();
        editor.apply();
    }
}
