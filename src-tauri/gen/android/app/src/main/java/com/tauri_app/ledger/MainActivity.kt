package com.tauri_app.ledger

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat

class MainActivity : TauriActivity() {
    // Tauri 模板把父类的 handleBackNavigation 覆写为 false，等于不注册任何后退回调：
    // 侧滑返回/返回键会直接落给 Activity 默认行为，finish 掉自己 → 表现为「侧滑直接退出应用」。
    // 前端（src/main.js 的 syncBackState / popstate）已把 UI 层级同步进 WebView 历史，
    // 这里把它打开，返回手势才会先交给 WebView：能回退就回退（触发 popstate 逐层关闭弹层/页面），
    // 历史耗尽（canGoBack() 为 false）时才退回系统默认的退出应用。
    override val handleBackNavigation: Boolean = true

    override fun onCreate(savedInstanceState: Bundle?) {
        enableEdgeToEdge()
        super.onCreate(savedInstanceState)

        // 只隐藏顶部状态栏，底部导航栏保留
        val controller = WindowInsetsControllerCompat(window, window.decorView)
        controller.hide(WindowInsetsCompat.Type.statusBars())
        controller.systemBarsBehavior =
            WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    }
}