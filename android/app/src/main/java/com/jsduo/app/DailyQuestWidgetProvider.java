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
    private static final String PREFS_NAME = DuoAppIcon.PREFS_NAME;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) {
            updateAppWidget(context, manager, id);
        }
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
        RemoteViews views = new RemoteViews(context.getPackageName(),
                layoutFor(manager, appWidgetId));
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);

        int streak = prefs.getInt("streak", 0);
        int dailyXp = Math.max(0, prefs.getInt("daily_xp", 0));
        int dailyXpTarget = Math.max(1, prefs.getInt("daily_xp_target", 30));
        String lastActiveDate = prefs.getString("lastActiveDate", "");
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
        boolean practicedToday = sdf.format(new Date()).equals(lastActiveDate);

        long lastActiveAt = DuoAppIcon.resolveLastActiveAt(context, lastActiveDate);
        String mood = DuoAppIcon.moodFor(lastActiveAt);
        int moodIcon;
        switch (mood) {
            case "worried":
                moodIcon = R.drawable.ic_widget_worried;
                break;
            case "sad":
                moodIcon = R.drawable.ic_widget_sad;
                break;
            case "panicked":
                moodIcon = R.drawable.ic_widget_panicked;
                break;
            case "desperate":
                moodIcon = R.drawable.ic_widget_desperate;
                break;
            default:
                moodIcon = R.drawable.ic_widget_happy;
                break;
        }

        views.setTextViewText(R.id.widget_streak_count, String.valueOf(streak));
        views.setTextViewText(R.id.widget_xp_count, dailyXp + "/" + dailyXpTarget + " XP");
        views.setProgressBar(R.id.widget_xp_progress, dailyXpTarget,
                Math.min(dailyXpTarget, dailyXp), false);
        views.setImageViewResource(R.id.widget_status_icon, moodIcon);
        views.setImageViewResource(R.id.widget_mascot_logo, moodIcon);

        if (practicedToday && "happy".equals(mood)) {
            views.setTextViewText(R.id.widget_status_title, "Dzisiejsza lekcja zaliczona!");
            views.setTextViewText(R.id.widget_status_desc,
                    "Świetna robota! Cyberkot jest zadowolony.");
        } else {
            switch (mood) {
                case "worried":
                    views.setTextViewText(R.id.widget_status_title,
                            "Cyberkot zaczyna się martwić…");
                    views.setTextViewText(R.id.widget_status_desc,
                            "Minęło już 6 godzin. Wróć na krótką lekcję.");
                    break;
                case "sad":
                    views.setTextViewText(R.id.widget_status_title, "Długo Cię nie było…");
                    views.setTextViewText(R.id.widget_status_desc,
                            "Cyberkot tęskni za wspólnym kodowaniem.");
                    break;
                case "panicked":
                    views.setTextViewText(R.id.widget_status_title,
                            "Cyberkot wpada w panikę!");
                    views.setTextViewText(R.id.widget_status_desc,
                            "Minęło już 18 godzin od ostatniej lekcji.");
                    break;
                case "desperate":
                    views.setTextViewText(R.id.widget_status_title,
                            "Cyberkot bardzo za Tobą tęskni");
                    views.setTextViewText(R.id.widget_status_desc,
                            "Minęły co najmniej 24 godziny. Czas wrócić do JS-Duo.");
                    break;
                default:
                    views.setTextViewText(R.id.widget_status_title, "Miło Cię widzieć!");
                    views.setTextViewText(R.id.widget_status_desc,
                            "Cyberkot jest zadowolony. Utrzymaj rytm nauki.");
                    break;
            }
        }
        views.setTextViewText(R.id.widget_action_button, "Ćwicz teraz");

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
        manager.updateAppWidget(appWidgetId, views);
    }

    private static int layoutFor(AppWidgetManager manager, int appWidgetId) {
        android.os.Bundle options = manager.getAppWidgetOptions(appWidgetId);
        int width = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 250);
        int height = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110);
        if (width < 220) return R.layout.widget_daily_quest_small;
        if (height >= 150) return R.layout.widget_daily_quest_large;
        return R.layout.widget_daily_quest;
    }
}
