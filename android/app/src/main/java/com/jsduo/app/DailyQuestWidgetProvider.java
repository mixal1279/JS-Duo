package com.jsduo.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class DailyQuestWidgetProvider extends AppWidgetProvider {

    public static final String ACTION_REFRESH_WIDGET = "com.jsduo.app.ACTION_REFRESH_WIDGET";
    private static final String PREFS_NAME = "CapacitorStorage";

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_REFRESH_WIDGET.equals(intent.getAction()) || 
            Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction()) ||
            Intent.ACTION_MY_PACKAGE_REPLACED.equals(intent.getAction())) {
            
            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, DailyQuestWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            if (appWidgetIds != null && appWidgetIds.length > 0) {
                onUpdate(context, appWidgetManager, appWidgetIds);
            }
        }
    }

    public static void updateAppWidget(Context context, AppWidgetManager appWidgetManager, int appWidgetId) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_daily_quest);

        // Read streak and last active date from SharedPreferences
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        
        int streak = 0;
        int hearts = 5;
        int xp = 0;
        int dailyXp = 0;
        int dailyXpTarget = 30;
        String lastActiveDate = "";

        try {
            // First check if user stats JSON or direct values are stored
            String statsJson = prefs.getString("js_duo_user_stats_v3_clean", null);
            if (statsJson != null) {
                // Simple fast parsing of fields from JSON string
                streak = parseJsonInt(statsJson, "\"streak\":", 0);
                hearts = parseJsonInt(statsJson, "\"hearts\":", 5);
                xp = parseJsonInt(statsJson, "\"xp\":", 0);
                lastActiveDate = parseJsonString(statsJson, "\"lastActiveDate\":");
            dailyXp = prefs.getInt("daily_xp", 0);
            dailyXpTarget = prefs.getInt("daily_xp_target", 30);
            }
        } catch (Exception e) {
            // fallback
        }

        // Check if user has practiced today
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        String todayStr = sdf.format(new Date());
        boolean practicedToday = todayStr.equals(lastActiveDate);

        // Update Views
        views.setTextViewText(R.id.widget_streak_count, String.valueOf(streak));
        views.setTextViewText(R.id.widget_hearts_count, hearts + "/5");
        views.setTextViewText(R.id.widget_xp_count, dailyXp + "/" + dailyXpTarget + " XP");
        views.setProgressBar(R.id.widget_xp_progress, Math.max(1, dailyXpTarget), Math.min(dailyXpTarget, dailyXp), false);

        if (practicedToday) {
            views.setTextViewText(R.id.widget_status_title, "Dzisiejsza lekcja zaliczona!");
            views.setTextViewText(R.id.widget_status_desc, "Świetna robota! Dzisiejszy cel XP jest ukończony.");
            views.setTextViewText(R.id.widget_action_button, "Powtórz materiał");
            views.setImageViewResource(R.id.widget_status_icon, R.drawable.ic_widget_check);
        } else {
            views.setTextViewText(R.id.widget_status_title, "Nie zapomnij o dzisiejszej lekcji!");
            if (streak > 0) {
                views.setTextViewText(R.id.widget_status_desc, "Masz " + dailyXp + "/" + dailyXpTarget + " XP. Zrób krótką lekcję i utrzymaj passę.");
            } else {
                views.setTextViewText(R.id.widget_status_desc, "Poświęć kilka minut na JavaScript i zdobądź dzisiejsze XP.");
            }
            views.setTextViewText(R.id.widget_action_button, "Rozpocznij lekcję teraz ⚡");
            views.setImageViewResource(R.id.widget_status_icon, R.drawable.ic_widget_flame);
        }

        // PendingIntent to launch the app when clicking the widget or action button
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        launchIntent.putExtra("from_widget", true);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(context, 0, launchIntent, flags);
        views.setOnClickPendingIntent(R.id.widget_container, pendingIntent);
        views.setOnClickPendingIntent(R.id.widget_action_button, pendingIntent);

        appWidgetManager.updateAppWidget(appWidgetId, views);
    }

    private static int parseJsonInt(String json, String key, int defaultValue) {
        try {
            int idx = json.indexOf(key);
            if (idx != -1) {
                int start = idx + key.length();
                while (start < json.length() && (json.charAt(start) == ' ' || json.charAt(start) == ':')) {
                    start++;
                }
                int end = start;
                while (end < json.length() && (Character.isDigit(json.charAt(end)) || json.charAt(end) == '-')) {
                    end++;
                }
                if (end > start) {
                    return Integer.parseInt(json.substring(start, end).trim());
                }
            }
        } catch (Exception ignored) {}
        return defaultValue;
    }

    private static String parseJsonString(String json, String key) {
        try {
            int idx = json.indexOf(key);
            if (idx != -1) {
                int quote1 = json.indexOf("\"", idx + key.length());
                if (quote1 != -1) {
                    int quote2 = json.indexOf("\"", quote1 + 1);
                    if (quote2 != -1) {
                        return json.substring(quote1 + 1, quote2);
                    }
                }
            }
        } catch (Exception ignored) {}
        return "";
    }
}
