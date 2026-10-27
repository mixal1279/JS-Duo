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

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    private static final String PREFS_NAME = "CapacitorStorage";

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        try {
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            SharedPreferences.Editor editor = prefs.edit();

            String statsJson = call.getString("statsJson");
            if (statsJson != null) {
                editor.putString("js_duo_user_stats_v3_clean", statsJson);
            }

            Integer streak = call.getInt("streak");
            if (streak != null) {
                editor.putInt("streak", streak);
            }

            Integer hearts = call.getInt("hearts");
            if (hearts != null) {
                editor.putInt("hearts", hearts);
            }

            String lastActiveDate = call.getString("lastActiveDate");
            if (lastActiveDate != null) {
                editor.putString("lastActiveDate", lastActiveDate);
            }

            Integer dailyXp = call.getInt("dailyXp");
            if (dailyXp != null) {
                editor.putInt("daily_xp", dailyXp);
            }

            Integer dailyXpTarget = call.getInt("dailyXpTarget");
            if (dailyXpTarget != null) {
                editor.putInt("daily_xp_target", dailyXpTarget);
            }

            editor.apply();

            // Trigger widget update broadcast
            Intent intent = new Intent(context, DailyQuestWidgetProvider.class);
            intent.setAction(DailyQuestWidgetProvider.ACTION_REFRESH_WIDGET);
            context.sendBroadcast(intent);

            AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
            ComponentName thisWidget = new ComponentName(context, DailyQuestWidgetProvider.class);
            int[] appWidgetIds = appWidgetManager.getAppWidgetIds(thisWidget);
            if (appWidgetIds != null && appWidgetIds.length > 0) {
                DailyQuestWidgetProvider provider = new DailyQuestWidgetProvider();
                provider.onUpdate(context, appWidgetManager, appWidgetIds);
            }

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to update widget data: " + e.getMessage());
        }
    }
}
