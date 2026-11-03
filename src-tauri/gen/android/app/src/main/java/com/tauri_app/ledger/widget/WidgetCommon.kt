package com.tauri_app.ledger.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.database.sqlite.SQLiteDatabase
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.RectF
import android.util.TypedValue
import android.widget.RemoteViews
import com.tauri_app.ledger.MainActivity
import java.io.File
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale
import java.util.concurrent.Executors

/** 组件展示用的最小数据快照，金额单位为「分」 */
data class WidgetSnapshot(
    val todayExpense: Long,
    val todayCount: Long,
    val monthExpense: Long,
    val budget: Long,
    val dayOfMonth: Int,
    val daysInMonth: Int
) {
    val monthAverage: Long
        get() = if (dayOfMonth > 0) monthExpense / dayOfMonth else 0L

    val budgetPercent: Int
        get() = if (budget > 0) Math.round(monthExpense * 100.0 / budget).toInt() else 0

    val budgetRemaining: Long
        get() = budget - monthExpense

    /** 剩余预算按剩余天数均摊（含今天） */
    val budgetDailyLeft: Long
        get() {
            if (budget <= 0) return 0L
            val leftDays = maxOf(1, daysInMonth - dayOfMonth + 1)
            return maxOf(0L, budgetRemaining) / leftDays
        }
}

/**
 * 三个桌面组件共用的数据与绘制工具。
 *
 * 数据直接只读访问 Rust 侧写入的 SQLite：Tauri 的 app_data_dir 在 Android 上
 * 解析为 `Context.dataDir`（/data/user/0/<包名>），数据库文件即 `ledger.sqlite`。
 */
object WidgetCommon {

    const val EXTRA_WIDGET_ACTION = "com.tauri_app.ledger.WIDGET_ACTION"
    const val ACTION_ADD = "add"

    private const val PREFS = "ledger_widget_cache"
    private val executor = Executors.newSingleThreadExecutor()

    /** 应用内记账/改账/删除后调用，刷新所有已添加的组件 */
    fun refreshAll(context: Context) {
        val appContext = context.applicationContext
        val manager = AppWidgetManager.getInstance(appContext)
        executor.execute {
            manager.getAppWidgetIds(
                ComponentName(appContext, LedgerWidgetProvider::class.java)
            ).forEach { LedgerWidgetProvider.render(appContext, manager, it) }
            manager.getAppWidgetIds(
                ComponentName(appContext, BudgetWidgetProvider::class.java)
            ).forEach { BudgetWidgetProvider.render(appContext, manager, it) }
            manager.getAppWidgetIds(
                ComponentName(appContext, QuickEntryWidgetProvider::class.java)
            ).forEach { QuickEntryWidgetProvider.render(appContext, manager, it) }
        }
    }

    fun runAsync(task: () -> Unit) {
        executor.execute(task)
    }

    fun openApp(context: Context, action: String? = null, requestCode: Int = 0): PendingIntent {
        val intent = Intent(context, MainActivity::class.java).apply {
            this.action = "com.tauri_app.ledger.OPEN_FROM_WIDGET"
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            if (action != null) putExtra(EXTRA_WIDGET_ACTION, action)
        }
        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    fun snapshot(context: Context): WidgetSnapshot {
        val dbFile = findDatabase(context) ?: return cachedSnapshot(context)
        return try {
            SQLiteDatabase.openDatabase(
                dbFile.absolutePath,
                null,
                SQLiteDatabase.OPEN_READONLY
            ).use { db ->
                val calendar = Calendar.getInstance()
                val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.CHINA)
                val today = formatter.format(calendar.time)
                val month = today.substring(0, 7)
                WidgetSnapshot(
                    todayExpense = sumExpense(db, "date = ?", arrayOf(today)),
                    todayCount = countToday(db, today),
                    monthExpense = sumExpense(db, "date LIKE ?", arrayOf("$month-%")),
                    budget = readBudget(db, month),
                    dayOfMonth = calendar.get(Calendar.DAY_OF_MONTH),
                    daysInMonth = calendar.getActualMaximum(Calendar.DAY_OF_MONTH)
                ).also { cacheSnapshot(context, it) }
            }
        } catch (e: Exception) {
            cachedSnapshot(context)
        }
    }

    /** 按格式化后的字符数分档缩字号，保证金额不被截断（RemoteViews 不能自定义 View） */
    fun fitAmount(
        views: RemoteViews,
        viewId: Int,
        text: String,
        maxSp: Float,
        minSp: Float
    ) {
        val sp = when {
            text.length <= 6 -> maxSp
            text.length <= 8 -> maxSp - 2f
            text.length <= 10 -> maxSp - 5f
            text.length <= 12 -> maxSp - 8f
            else -> minSp
        }.coerceAtLeast(minSp)
        views.setTextViewText(viewId, text)
        views.setTextViewTextSize(viewId, TypedValue.COMPLEX_UNIT_SP, sp)
    }

    /** 用 Canvas 画预算环（RemoteViews 无法直接画圆环） */
    fun ringBitmap(
        context: Context,
        percent: Int,
        diameterDp: Int,
        strokeDp: Float,
        color: Int,
        trackColor: Int
    ): Bitmap {
        val size = dp(context, diameterDp.toFloat())
        val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val stroke = dp(context, strokeDp)
        val inset = stroke / 2f
        val rect = RectF(inset, inset, size - inset, size - inset)
        val paint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
            style = Paint.Style.STROKE
            strokeWidth = stroke.toFloat()
            strokeCap = Paint.Cap.ROUND
        }
        paint.color = trackColor
        canvas.drawArc(rect, -90f, 360f, false, paint)
        paint.color = color
        canvas.drawArc(
            rect,
            -90f,
            360f * percent.coerceIn(0, 100) / 100f,
            false,
            paint
        )
        return bitmap
    }

    fun money(cents: Long): String {
        val value = if (cents < 0) -cents else cents
        val grouped = NumberFormat.getIntegerInstance(Locale.CHINA).format(value / 100)
        val decimals = String.format(Locale.CHINA, "%02d", value % 100)
        return (if (cents < 0) "-¥" else "¥") + grouped + "." + decimals
    }

    private fun dp(context: Context, value: Float): Int =
        TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value,
            context.resources.displayMetrics
        ).toInt()

    private fun sumExpense(
        db: SQLiteDatabase,
        condition: String,
        args: Array<String>
    ): Long {
        val sql = "SELECT COALESCE(SUM(amount_cents), 0) FROM transactions " +
            "WHERE type = 'expense' AND $condition"
        db.rawQuery(sql, args).use { cursor ->
            return if (cursor.moveToFirst()) cursor.getLong(0) else 0L
        }
    }

    private fun countToday(db: SQLiteDatabase, today: String): Long {
        db.rawQuery(
            "SELECT COUNT(*) FROM transactions WHERE date = ?",
            arrayOf(today)
        ).use { cursor ->
            return if (cursor.moveToFirst()) cursor.getLong(0) else 0L
        }
    }

    private fun readBudget(db: SQLiteDatabase, month: String): Long {
        db.rawQuery("SELECT amount_cents FROM budgets WHERE month = ?", arrayOf(month))
            .use { cursor ->
                return if (cursor.moveToFirst()) cursor.getLong(0) else 0L
            }
    }

    private fun findDatabase(context: Context): File? {
        // Tauri app_data_dir: Context.dataDir（不是 filesDir）
        val direct = File(context.applicationInfo.dataDir, "ledger.sqlite")
        if (direct.isFile) return direct
        val fallbacks = listOf(
            File(context.filesDir, "ledger.sqlite"),
            File(context.noBackupFilesDir, "ledger.sqlite")
        )
        fallbacks.forEach { if (it.isFile) return it }
        return null
    }

    private fun cacheSnapshot(context: Context, snapshot: WidgetSnapshot) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putLong("todayExpense", snapshot.todayExpense)
            .putLong("todayCount", snapshot.todayCount)
            .putLong("monthExpense", snapshot.monthExpense)
            .putLong("budget", snapshot.budget)
            .putInt("dayOfMonth", snapshot.dayOfMonth)
            .putInt("daysInMonth", snapshot.daysInMonth)
            .apply()
    }

    private fun cachedSnapshot(context: Context): WidgetSnapshot {
        val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
        return WidgetSnapshot(
            todayExpense = prefs.getLong("todayExpense", 0),
            todayCount = prefs.getLong("todayCount", 0),
            monthExpense = prefs.getLong("monthExpense", 0),
            budget = prefs.getLong("budget", 0),
            dayOfMonth = prefs.getInt("dayOfMonth", 1),
            daysInMonth = prefs.getInt("daysInMonth", 30)
        )
    }
}
