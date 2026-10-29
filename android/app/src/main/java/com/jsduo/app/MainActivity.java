package com.jsduo.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);
        // Reconcile the launcher icon and widget with the last saved activity as soon as the app opens.
        DuoAppIcon.refresh(this);
    }
}
