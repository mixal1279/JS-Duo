package com.jsduo.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;

/** Keeps the Android launcher icon in sync with the mascot's daily mood. */
public final class DuoAppIcon {
    private DuoAppIcon() {}

    public static String moodFor(String lastActiveDate) {
        String today = new java.text.SimpleDateFormat("yyyy-MM-dd", java.util.Locale.getDefault()).format(new java.util.Date());
        if (today.equals(lastActiveDate)) return "happy";
        int hour = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY);
        if (hour < 13) return "worried";
        if (hour < 18) return "sad";
        if (hour < 21) return "panicked";
        return "desperate";
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

    private static String capitalize(String value) {
        if (value == null || value.isEmpty()) return "Happy";
        return value.substring(0, 1).toUpperCase(java.util.Locale.ROOT) + value.substring(1).toLowerCase(java.util.Locale.ROOT);
    }
}
