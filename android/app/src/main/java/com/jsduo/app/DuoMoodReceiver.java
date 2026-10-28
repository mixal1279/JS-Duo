package com.jsduo.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Refreshes the app icon and home-screen widget at mood thresholds and after reboot. */
public class DuoMoodReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        DuoAppIcon.refresh(context);
    }
}
