package com.jsduo.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.SharedPreferences;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

/** Computes and applies the mascot mood from the time since the last completed lesson. */
public final class DuoAppIcon {
    public static final String PREFS_NAME = "CapacitorStorage";
    public static final String KEY_LAST_ACTIVE_AT = "lastActiveAt";
    public static final String ACTION_MOOD_REFRESH = "com.jsduo.app.ACTION_MOOD_REFRESH";
    private static final long HOUR_MS = 60L * 60L * 1000L;

    private DuoAppIcon() {}

    public static String moodFor(long lastActiveAt) {
        if (lastActiveAt <= 0L) return "desperate";
        long elapsed = Math.max(0L, System.currentTimeMillis() - lastActiveAt);
        if (elapsed < 6L * HOUR_MS) return "happy";
        if (elapsed < 12L * HOUR_MS) return "worried";
        if (elapsed < 18L * HOUR_MS) return "sad";
        if (elapsed < 24L * HOUR_MS) return "panicked";
        return "desperate";
    }

    /** Backwards-compatible fallback for installs that only stored a date, not a timestamp. */
    public static long resolveLastActiveAt(Context context, String lastActiveDate) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        long saved = prefs.getLong(KEY_LAST_ACTIVE_AT, 0L);
        if (saved > 0L) return saved;
        if (lastActiveDate == null || lastActiveDate.isEmpty()) return 0L;
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            sdf.setLenient(false);
            Date date = sdf.parse(lastActiveDate);
            if (date == null) return 0L;
            // Legacy date-only records cannot tell us the exact completion time.
            long inferred = date.getTime();
            prefs.edit().putLong(KEY_LAST_ACTIVE_AT, inferred).apply();
            return inferred;
        } catch (Exception ignored) {
            return 0L;
        }
    }

    public static void update(Context context, String mood) {
        String[] names = {"Happy", "Worried", "Sad", "Panicked", "Desperate"};
        String selected = "MainActivity" + capitalize(mood);
        PackageManager pm = context.getPackageManager();
        for (String name : names) {
            ComponentName component = new ComponentName(context, "com.jsduo.app." + "MainActivity" + name);
            int state = ("MainActivity" + name).equals(selected)
                    ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED
                    : PackageManager.COMPONENT_ENABLED_STATE_DISABLED;
            pm.setComponentEnabledSetting(component, state, PackageManager.DONT_KILL_APP);
        }
    }

    public static void refresh(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String lastActiveDate = prefs.getString("lastActiveDate", "");
        long lastActiveAt = resolveLastActiveAt(context, lastActiveDate);
        update(context, moodFor(lastActiveAt));

        Intent refreshWidget = new Intent(context, DailyQuestWidgetProvider.class);
        refreshWidget.setAction(DailyQuestWidgetProvider.ACTION_REFRESH_WIDGET);
        context.sendBroadcast(refreshWidget);
        scheduleNextRefresh(context, lastActiveAt);
    }

    public static void scheduleNextRefresh(Context context, long lastActiveAt) {
        if (lastActiveAt <= 0L) return;
        long now = System.currentTimeMillis();
        long[] boundaries = {6L * HOUR_MS, 12L * HOUR_MS, 18L * HOUR_MS, 24L * HOUR_MS};
        long next = 0L;
        for (long boundary : boundaries) {
            long at = lastActiveAt + boundary;
            if (at > now) { next = at; break; }
        }
        if (next == 0L) return;
        Intent intent = new Intent(context, DuoMoodReceiver.class);
        intent.setAction(ACTION_MOOD_REFRESH);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        PendingIntent pending = PendingIntent.getBroadcast(context, 9137, intent, flags);
        AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarmManager != null) {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, next, pending);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, next, pending);
            }
        }
    }

    private static String capitalize(String value) {
        if (value == null || value.isEmpty()) return "Happy";
        return value.substring(0, 1).toUpperCase(Locale.ROOT) + value.substring(1).toLowerCase(Locale.ROOT);
    }
}
