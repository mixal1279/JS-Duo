package com.jsduo.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class DailyQuestWidgetProvider extends AppWidgetProvider {
    public static final String ACTION_REFRESH_WIDGET = "com.jsduo.app.ACTION_REFRESH_WIDGET";
    private static final String PREFS_NAME = DuoAppIcon.PREFS_NAME;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateAppWidget(context, manager, id);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, android.os.Bundle newOptions) {
        updateAppWidget(context, manager, appWidgetId);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        String action = intent.getAction();
        if (ACTION_REFRESH_WIDGET.equals(action)
                || Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName widget = new ComponentName(context, DailyQuestWidgetProvider.class);
            int[] ids = manager.getAppWidgetIds(widget);
            if (ids != null && ids.length > 0) {
                onUpdate(context, manager, ids);
            }
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_daily_quest);
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        int streak = Math.max(0, prefs.getInt("streak", 0));
        String lastActiveDate = prefs.getString("lastActiveDate", "");
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        boolean practicedToday = sdf.format(new Date()).equals(lastActiveDate);
        int hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY);

        // Three clear states: gray before practice, amber late in the day, green after today's lesson.
        final int background;
        final int accent;
        if (practicedToday) {
            background = R.drawable.widget_bg_streak_green;
            accent = Color.rgb(20, 230, 200);
        } else if (streak > 0 && hour >= 20) {
            background = R.drawable.widget_bg_streak_amber;
            accent = Color.rgb(255, 181, 46);
        } else {
            background = R.drawable.widget_bg_streak_gray;
            accent = Color.rgb(130, 145, 165);
        }

        long lastActiveAt = DuoAppIcon.resolveLastActiveAt(context, lastActiveDate);
        String mood = DuoAppIcon.moodFor(lastActiveAt);
        int moodIcon;
        switch (mood) {
            case "worried":
                moodIcon = R.drawable.cybercat_worried;
                break;
            case "sad":
                moodIcon = R.drawable.cybercat_sad;
                break;
            case "panicked":
                moodIcon = R.drawable.cybercat_panicked;
                break;
            case "desperate":
                moodIcon = R.drawable.cybercat_desperate;
                break;
            default:
                moodIcon = R.drawable.cybercat_happy;
                break;
        }

        views.setTextViewText(R.id.widget_streak_count, String.valueOf(streak));
        views.setImageViewResource(R.id.widget_status_icon, moodIcon);
        views.setImageViewResource(R.id.widget_streak_icon, R.drawable.ic_widget_code);
        views.setInt(R.id.widget_streak_icon, "setColorFilter", accent);
        views.setInt(R.id.widget_container, "setBackgroundResource", background);

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        launchIntent.putExtra("from_widget", true);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, launchIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);
        manager.updateAppWidget(appWidgetId, views);
    }
}