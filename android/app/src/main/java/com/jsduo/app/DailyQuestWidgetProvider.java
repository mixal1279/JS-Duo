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
import java.util.TimeZone;

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

    private static int daysSinceLocalDate(String dateString) {
        if (dateString == null || dateString.isEmpty()) return Integer.MAX_VALUE;
        try {
            SimpleDateFormat utcFormat = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            utcFormat.setLenient(false);
            utcFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date lastActive = utcFormat.parse(dateString);
            String todayLocal = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
            Date today = utcFormat.parse(todayLocal);
            if (lastActive == null || today == null) return Integer.MAX_VALUE;
            return (int) ((today.getTime() - lastActive.getTime()) / 86_400_000L);
        } catch (Exception ignored) {
            return Integer.MAX_VALUE;
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_daily_quest);
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        int streak = Math.max(0, prefs.getInt("streak", 0));
        int streakFreeze = Math.max(0, prefs.getInt("streakFreeze", 0));
        String lastActiveDate = prefs.getString("lastActiveDate", "");
        int daysSinceLastActivity = daysSinceLocalDate(lastActiveDate);
        boolean practicedToday = daysSinceLastActivity == 0;
        boolean freezeProtectsStreak = daysSinceLastActivity == 2 && streakFreeze > 0;

        // Mirror storageService.validateAndSyncStreak(): a cached streak must not
        // remain visible forever when the app has not been opened for several days.
        // The widget only derives the display value; the app remains responsible
        // for persisting the reset or consuming a streak freeze.
        int displayStreak = streak;
        if (lastActiveDate.isEmpty()
                || (daysSinceLastActivity > 1 && !freezeProtectsStreak)) {
            displayStreak = 0;
        }

        int hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY);
        boolean streakAtRisk = displayStreak > 0
                && !practicedToday
                && daysSinceLastActivity >= 1
                && (daysSinceLastActivity == 1 || freezeProtectsStreak)
                && hour >= 20;

        // Three visual states share one fixed widget layout and footprint.
        final int background;
        final int accent;
        final String statusTitle;
        final String statusDescription;
        if (practicedToday) {
            background = R.drawable.widget_bg_streak_green;
            accent = Color.rgb(20, 230, 200);
            statusTitle = "Super robota!";
            statusDescription = "Passa zaliczona";
        } else if (streakAtRisk) {
            background = R.drawable.widget_bg_streak_amber;
            accent = Color.rgb(255, 181, 46);
            statusTitle = "Nie daj się zatrzymać!";
            statusDescription = freezeProtectsStreak
                    ? "Zamrożenie chroni passę"
                    : "Passa zagrożona";
        } else {
            background = R.drawable.widget_bg_streak_gray;
            accent = Color.rgb(130, 145, 165);
            statusTitle = "Czas na kolejną lekcję?";
            statusDescription = "Passa niezaliczona";
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

        views.setTextViewText(R.id.widget_streak_count, String.valueOf(displayStreak));
        views.setTextViewText(R.id.widget_status_title, statusTitle);
        views.setTextViewText(R.id.widget_status_desc, statusDescription);
        views.setImageViewResource(R.id.widget_status_icon, moodIcon);
        views.setImageViewResource(R.id.widget_streak_icon, R.drawable.ic_widget_code);
        views.setInt(R.id.widget_streak_icon, "setColorFilter", accent);
        int dailyXp = Math.max(0, prefs.getInt("daily_xp", 0));
        int dailyXpTarget = Math.max(1, prefs.getInt("daily_xp_target", 30));
        int progress = Math.min(dailyXp, dailyXpTarget);
        views.setProgressBar(R.id.widget_xp_progress, dailyXpTarget, progress, false);
        views.setProgressBar(R.id.widget_xp_progress_amber, dailyXpTarget, progress, false);
        views.setProgressBar(R.id.widget_xp_progress_green, dailyXpTarget, progress, false);
        views.setViewVisibility(R.id.widget_xp_progress, practicedToday || streakAtRisk ? android.view.View.GONE : android.view.View.VISIBLE);
        views.setViewVisibility(R.id.widget_xp_progress_amber, streakAtRisk ? android.view.View.VISIBLE : android.view.View.GONE);
        views.setViewVisibility(R.id.widget_xp_progress_green, practicedToday ? android.view.View.VISIBLE : android.view.View.GONE);
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