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
            if (statsJson != null) {
                editor.putString("js_duo_user_stats_v3_clean", statsJson);
                int lessonCount = readCompletedLessonCount(statsJson);
                int previousLessonCount = prefs.getInt(KEY_LESSON_COUNT, -1);
                long lastActiveAt = prefs.getLong(DuoAppIcon.KEY_LAST_ACTIVE_AT, 0L);

                // A newly completed lesson advances completedLessonKeys. Ordinary widget syncs
                // must not reset the inactivity timer.
                if (lessonCount >= 0 && previousLessonCount >= 0 && lessonCount > previousLessonCount) {
                    lastActiveAt = System.currentTimeMillis();
                    editor.putLong(DuoAppIcon.KEY_LAST_ACTIVE_AT, lastActiveAt);
                }
                if (lessonCount >= 0) editor.putInt(KEY_LESSON_COUNT, lessonCount);

                if (lastActiveAt <= 0L && lastActiveDate != null && !lastActiveDate.isEmpty()) {
                    long inferred = inferInitialActivityTime(lastActiveDate);
                    if (inferred > 0L) editor.putLong(DuoAppIcon.KEY_LAST_ACTIVE_AT, inferred);
                }
            }

            Integer streak = call.getInt("streak");
            if (streak != null) editor.putInt("streak", streak);

            Integer hearts = call.getInt("hearts");
            if (hearts != null) editor.putInt("hearts", hearts);

            if (lastActiveDate != null) editor.putString("lastActiveDate", lastActiveDate);

            Integer dailyXp = call.getInt("dailyXp");
            if (dailyXp != null) editor.putInt("daily_xp", dailyXp);

            Integer dailyXpTarget = call.getInt("dailyXpTarget");
            if (dailyXpTarget != null) editor.putInt("daily_xp_target", dailyXpTarget);

            Integer completedQuestCount = call.getInt("dailyQuestCompletedCount");
            if (completedQuestCount != null) editor.putInt(KEY_QUEST_COMPLETED_COUNT, Math.max(0, completedQuestCount));
            Integer totalQuestCount = call.getInt("dailyQuestTotalCount");
            if (totalQuestCount != null) editor.putInt(KEY_QUEST_TOTAL_COUNT, Math.max(0, totalQuestCount));
            String nextQuestTitle = call.getString("nextDailyQuestTitle");
            if (nextQuestTitle != null) editor.putString(KEY_NEXT_QUEST_TITLE, nextQuestTitle);

            editor.apply();

            // Recalculate immediately, then schedule a native refresh for the next threshold.
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

    private static int readCompletedLessonCount(String json) {
        try {
            JSONObject stats = new JSONObject(json);
            JSONArray lessons = stats.optJSONArray("completedLessonKeys");
            if (lessons != null) return lessons.length();
            // Do not use completedQuestionIds here: they can increase mid-lesson.
            // The inactivity clock must reset only after a lesson is completed.
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
