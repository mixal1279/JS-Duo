package com.jsduo.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.pm.PackageManager;

public final class DuoAppIcon {
    private DuoAppIcon() {}
    public static void update(Context context, String mood) {
        String wanted = "Worried";
        if ("happy".equals(mood)) wanted = "Happy";
        else if ("sad".equals(mood)) wanted = "Sad";
        else if ("panicked".equals(mood)) wanted = "Panicked";
        else if ("desperate".equals(mood)) wanted = "Desperate";
        String[] names = {"Happy", "Worried", "Sad", "Panicked", "Desperate"};
        PackageManager pm = context.getPackageManager();
        for (String name : names) {
            pm.setComponentEnabledSetting(new ComponentName(context, "com.jsduo.app.MainActivity" + name), name.equals(wanted) ? PackageManager.COMPONENT_ENABLED_STATE_ENABLED : PackageManager.COMPONENT_ENABLED_STATE_DISABLED, PackageManager.DONT_KILL_APP);
        }
    }
}
