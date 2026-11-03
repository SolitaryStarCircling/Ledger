package com.tauri_app.ledger.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import com.tauri_app.ledger.R

/** 预算环组件（2x2）：环形进度 + 剩余金额 + 日均可用 */
class BudgetWidgetProvider : AppWidgetProvider() {

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
            val views = RemoteViews(context.packageName, R.layout.widget_ledger_budget)
            val hasBudget = snapshot.budget > 0
            val percent = if (hasBudget) snapshot.budgetPercent else 0
            val over = hasBudget && snapshot.budgetRemaining < 0

            views.setImageViewBitmap(
                R.id.budget_ring,
                WidgetCommon.ringBitmap(
                    context,
                    percent,
                    diameterDp = 60,
                    strokeDp = 5f,
                    color = context.getColor(
                        if (over) R.color.widget_expense else R.color.widget_accent
                    ),
                    trackColor = context.getColor(R.color.widget_progress_track)
                )
            )
            views.setTextViewText(
                R.id.budget_percent,
                if (hasBudget) "$percent%" else "—"
            )
            views.setTextViewText(
                R.id.budget_left,
                if (hasBudget) {
                    (if (over) "超支 " else "剩 ") +
                        WidgetCommon.money(if (over) -snapshot.budgetRemaining else snapshot.budgetRemaining) +
                        " · 日均 " + WidgetCommon.money(snapshot.budgetDailyLeft)
                } else {
                    "未设置本月预算"
                }
            )
            val color = context.getColor(
                if (over) R.color.widget_expense else R.color.widget_text2
            )
            views.setTextColor(R.id.budget_left, color)
            views.setOnClickPendingIntent(
                R.id.widget_root,
                WidgetCommon.openApp(context)
            )
            manager.updateAppWidget(widgetId, views)
        }
    }
}
