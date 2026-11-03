package com.tauri_app.ledger.widget

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.view.View
import android.widget.RemoteViews
import com.tauri_app.ledger.R

/**
 * 汇总组件：今日支出 / 本月支出 / 预算进度。
 * 2x2 与 3x2 用 compact 布局，4x2 起换成 wide 布局，两套语义保持一致：
 * 右上角固定是「本月支出」，底部固定是「预算剩余」。
 */
class LedgerWidgetProvider : AppWidgetProvider() {

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

    override fun onAppWidgetOptionsChanged(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetId: Int,
        newOptions: android.os.Bundle
    ) {
        WidgetCommon.runAsync { render(context, appWidgetManager, appWidgetId) }
    }

    companion object {
        fun render(context: Context, manager: AppWidgetManager, widgetId: Int) {
            val snapshot = WidgetCommon.snapshot(context)
            val minWidth = manager.getAppWidgetOptions(widgetId)
                .getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 110)
            val wide = minWidth >= 220

            val views = RemoteViews(
                context.packageName,
                if (wide) R.layout.widget_ledger_wide else R.layout.widget_ledger_compact
            )
            WidgetCommon.fitAmount(
                views,
                R.id.widget_today_amount,
                WidgetCommon.money(snapshot.todayExpense),
                if (wide) 24f else 20f,
                12f
            )
            WidgetCommon.fitAmount(
                views,
                R.id.widget_month_amount,
                WidgetCommon.money(snapshot.monthExpense),
                if (wide) 18f else 14f,
                10f
            )

            if (wide) {
                views.setTextViewText(
                    R.id.widget_today_info,
                    "今日 ${snapshot.todayCount} 笔 · 日均 ${WidgetCommon.money(snapshot.monthAverage)}"
                )
            }
            applyBudget(context, views, snapshot)
            views.setOnClickPendingIntent(
                R.id.widget_root,
                WidgetCommon.openApp(context)
            )
            manager.updateAppWidget(widgetId, views)
        }

        private fun applyBudget(
            context: Context,
            views: RemoteViews,
            snapshot: WidgetSnapshot
        ) {
            if (snapshot.budget <= 0) {
                views.setViewVisibility(R.id.widget_progress, View.GONE)
                views.setTextViewText(R.id.widget_budget_text, "未设置本月预算")
                views.setTextViewText(R.id.widget_budget_percent, "")
                views.setTextColor(
                    R.id.widget_budget_text,
                    context.getColor(R.color.widget_text2)
                )
                return
            }

            val percent = snapshot.budgetPercent
            val remaining = snapshot.budgetRemaining
            val over = remaining < 0
            views.setViewVisibility(R.id.widget_progress, View.VISIBLE)
            views.setProgressBar(R.id.widget_progress, 100, minOf(percent, 100), false)
            views.setTextViewText(
                R.id.widget_budget_text,
                (if (over) "超支 " else "预算剩 ") +
                    WidgetCommon.money(if (over) -remaining else remaining)
            )
            views.setTextViewText(R.id.widget_budget_percent, "$percent%")
            val color = context.getColor(
                if (over) R.color.widget_expense else R.color.widget_text2
            )
            views.setTextColor(R.id.widget_budget_text, color)
            views.setTextColor(R.id.widget_budget_percent, color)
        }
    }
}
