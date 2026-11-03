package com.tauri_app.ledger.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.tauri_app.ledger.R

/**
 * 快捷记账组件（2x1）：整卡点击直接打开 App 的「记一笔」面板。
 * 原生层把动作写进数据目录，前端启动 / 回到前台时取走并打开面板（见 take_widget_action）。
 */
class QuickEntryWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val pending = goAsync()
        WidgetCommon.runAsync {
            try {
                appWidgetIds.forEach { render(context, appWidgetManager, it) }
            } finally {
                pending.finish()
            }
        }
    }

    companion object {
        fun render(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val snapshot = WidgetCommon.snapshot(context)
            val views = RemoteViews(context.packageName, R.layout.widget_ledger_quick)
            views.setTextViewText(
                R.id.quick_sub,
                "今日 " + WidgetCommon.money(snapshot.todayExpense) +
                    " · ${snapshot.todayCount} 笔"
            )
            views.setOnClickPendingIntent(
                R.id.widget_root,
                WidgetCommon.openApp(context, WidgetCommon.ACTION_ADD, requestCode = 1)
            )
            manager.updateAppWidget(widgetId, views)
        }
    }
}
