package com.jsduo.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {
    private static final String PREFS_NAME = DuoAppIcon.PREFS_NAME;
    private static final String KEY_LESSON_COUNT = "mascot_completed_lesson_count";
    private static final String KEY_QUEST_COMPLETED_COUNT = "daily_quest_completed_count";
    private static final String KEY_QUEST_TOTAL_COUNT = "daily_quest_total_count";
    private static final String KEY_NEXT_QUEST_TITLE = "daily_quest_next_title";

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            String statsJson = call.getString("statsJson");
            String lastActiveDate = call.getString("lastActiveDate");
            Integer streak = call.getInt("streak");

            // Treat UserStats JSON as the canonical snapshot. The individual fields are
            // also stored for the native widget, but can be absent in older bridge callers.
            if (statsJson != null) {
                editor.putString("js_duo_user_stats_v3_clean", statsJson);
                try {
                    JSONObject stats = new JSONObject(statsJson);
                    if (streak == null) streak = stats.has("streak") ? stats.optInt("streak", 0) : null;
                    if (lastActiveDate == null) lastActiveDate = stats.optString("lastActiveDate", "");

                    int lessonCount = readCompletedLessonCount(statsJson);
                    int previousLessonCount = prefs.getInt(KEY_LESSON_COUNT, -1);
                    long lastActiveAt = prefs.getLong(DuoAppIcon.KEY_LAST_ACTIVE_AT, 0L);
                    long completedAt = readLastLessonCompletedAt(statsJson);

                    if (completedAt > lastActiveAt) {
                        lastActiveAt = completedAt;
                        editor.putLong(DuoAppIcon.KEY_LAST_ACTIVE_AT, lastActiveAt);
                    } else if (lessonCount >= 0 && previousLessonCount >= 0 && lessonCount > previousLessonCount) {
                        lastActiveAt = System.currentTimeMillis();
                        editor.putLong(DuoAppIcon.KEY_LAST_ACTIVE_AT, lastActiveAt);
                    }

                    if (lessonCount >= 0) editor.putInt(KEY_LESSON_COUNT, lessonCount);

                    if (lastActiveDate != null && !lastActiveDate.isEmpty()) {
                        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
                        if (today.equals(lastActiveDate) && (lastActiveAt <= 0L || !today.equals(
                                new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date(lastActiveAt))))) {
                            lastActiveAt = System.currentTimeMillis();
                            editor.putLong(DuoAppIcon.KEY_LAST_ACTIVE_AT, lastActiveAt);
                        } else if (lastActiveAt <= 0L) {
                            long inferred = inferInitialActivityTime(lastActiveDate);
                            if (inferred > 0L) editor.putLong(DuoAppIcon.KEY_LAST_ACTIVE_AT, inferred);
                        }
                    }
                } catch (Exception ignored) {
                    // Keep the raw snapshot, but don't overwrite good individual values
                    // when a malformed/older stats payload cannot be parsed.
                }
            }

            if (streak != null) editor.putInt("streak", Math.max(0, streak));

            Integer hearts = call.getInt("hearts");
            if (hearts != null) editor.putInt("hearts", hearts);

            if (lastActiveDate != null) editor.putString("lastActiveDate", lastActiveDate);

            Integer dailyXp = call.getInt("dailyXp");
            if (dailyXp != null) editor.putInt("daily_xp", Math.max(0, dailyXp));

            Integer dailyXpTarget = call.getInt("dailyXpTarget");
            if (dailyXpTarget != null) editor.putInt("daily_xp_target", Math.max(1, dailyXpTarget));

            Integer completedQuestCount = call.getInt("dailyQuestCompletedCount");
            if (completedQuestCount != null) editor.putInt(KEY_QUEST_COMPLETED_COUNT, Math.max(0, completedQuestCount));
            Integer totalQuestCount = call.getInt("dailyQuestTotalCount");
            if (totalQuestCount != null) editor.putInt(KEY_QUEST_TOTAL_COUNT, Math.max(0, totalQuestCount));
            String nextQuestTitle = call.getString("nextDailyQuestTitle");
            if (nextQuestTitle != null) editor.putString(KEY_NEXT_QUEST_TITLE, nextQuestTitle);

            editor.apply();

            // Refresh immediately so the launcher uses the latest canonical streak/date.
            DuoAppIcon.refresh(context);

            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            ComponentName widget = new ComponentName(context, DailyQuestWidgetProvider.class);
            int[] ids = manager.getAppWidgetIds(widget);
            if (ids != null && ids.length > 0) {
                new DailyQuestWidgetProvider().onUpdate(context, manager, ids);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to update widget data: " + e.getMessage());
        }
    }

    private static long readLastLessonCompletedAt(String json) {
        try {
            JSONObject stats = new JSONObject(json);
            return Math.max(0L, stats.optLong("lastLessonCompletedAt", 0L));
        } catch (Exception ignored) {
            return 0L;
        }
    }

    private static int readCompletedLessonCount(String json) {
        try {
            JSONObject stats = new JSONObject(json);
            JSONArray lessons = stats.optJSONArray("completedLessonKeys");
            if (lessons != null) return lessons.length();
            return -1;
        } catch (Exception ignored) {
            return -1;
        }
    }

    private static long inferInitialActivityTime(String dateString) {
        try {
            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
            sdf.setLenient(false);
            Date parsed = sdf.parse(dateString);
            if (parsed == null) return 0L;
            String today = sdf.format(new Date());
            if (today.equals(dateString)) return System.currentTimeMillis();
            return parsed.getTime();
        } catch (Exception ignored) {
            return 0L;
        }
    }
}