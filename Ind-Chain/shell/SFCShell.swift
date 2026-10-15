// Standard-Financial-Charting native shell.
//   SHELL-WINDOW : one NSWindow + WKWebView showing the Ind-Chain front end (web/), plus a native error panel.
//   SHELL-PROC   : one embedded back-end child process (server/app.py) owned by this shell (see Backend.swift).
// The shell adds no native capability to the page: no script bridge, loopback only.
import Cocoa
import WebKit

enum RunState { case starting, running, restarting, panel }

let minWindowSize = NSSize(width: 960, height: 640)

/// Pull a saved window frame back onto a visible screen and never below the minimum size.
func clampFrame(_ f: NSRect, screens: [NSRect], minSize: NSSize) -> NSRect {
    func overlap(_ a: NSRect, _ b: NSRect) -> CGFloat {
        let i = a.intersection(b)
        return i.isNull ? 0 : i.width * i.height
    }
    guard let vis = screens.max(by: { overlap($0, f) < overlap($1, f) }) else { return f }
    let w = max(minSize.width, min(f.width, vis.width))
    let h = max(minSize.height, min(f.height, vis.height))
    let x = min(max(f.minX, vis.minX), vis.maxX - w)
    let y = min(max(f.minY, vis.minY), vis.maxY - h)
    return NSRect(x: x, y: y, width: w, height: h)
}

final class AppDelegate: NSObject, NSApplicationDelegate, WKNavigationDelegate, WKUIDelegate {
    var window: NSWindow!
    var webView: WKWebView!
    var statusLabel: NSTextField!
    var panelView: ErrorPanel?
    var backend: BackendProc?
    var sigSources: [DispatchSourceSignal] = []
    var cleaned = false

    let paths = SFCPaths.make()
    let instanceLock = InstanceLock()
    var dirsOK = true
    var bundled = false
    var state: RunState = .starting
    var gen = 0  // bumps on every (re)start so late callbacks from an older start are dropped
    var restartTimes: [Date] = []
    var heartbeatTimer: Timer?
    var heartbeatFails = 0
    var webCrashTimes: [Date] = []

    // --selftest bookkeeping (see SelfTest.swift)
    let selfTestPath = selfTestMode ? (argValue("--start-path") ?? "/") : "/"
    let selfTestSnapshot = selfTestMode ? argValue("--snapshot") : nil
    let selfTestClick = selfTestMode ? argValue("--selftest-click") : nil
    let selfTestCloseMode = selfTestMode && CommandLine.arguments.contains("--selftest-close")
    var selfTestDone = false
    var selfTestProbed = false
    var selfTestRetries = 0
    var selfTestLogsTarget: String?
    var selfTestQuitClicked = false
    var selfTestResult: [String: Any] = [:]
    var selfTestCloseStart = Date()

    func applicationDidFinishLaunching(_ note: Notification) {
        NSApp.setActivationPolicy(selfTestMode ? .accessory : .regular)
        dirsOK = paths.ensureDirs()
        if !selfTestMode && dirsOK && !instanceLock.acquire(at: paths.lockURL) {
            activateRunningInstance()
            exit(0)  // already running: stay silent, never start a second back end
        }
        buildMenu()
        buildWindow()
        installSignalHandlers()
        if !selfTestMode { NSApp.activate(ignoringOtherApps: true) }
        DispatchQueue.main.async { self.start(attempt: 1, restart: false) }
        if selfTestMode {
            DispatchQueue.main.asyncAfter(deadline: .now() + 70) { self.finishSelfTest(["ok": false, "error": "timeout"]) }
        }
    }

    func activateRunningInstance() {
        let me = ProcessInfo.processInfo.processIdentifier
        guard let id = Bundle.main.bundleIdentifier,
              let other = NSRunningApplication.runningApplications(withBundleIdentifier: id)
                .first(where: { $0.processIdentifier != me }) else { return }
        other.unhide()
        other.activate(options: [.activateIgnoringOtherApps])
        if let url = other.bundleURL { NSWorkspace.shared.open(url) }  // reopen event: de-minimises the window
    }

    func applicationShouldHandleReopen(_ sender: NSApplication, hasVisibleWindows flag: Bool) -> Bool {
        if window.isMiniaturized { window.deminiaturize(nil) }
        window.makeKeyAndOrderFront(nil)
        return true
    }

    // window -----------------------------------------------------------------
    func buildWindow() {
        let screen = NSScreen.main?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        let w = min(1440, screen.width), h = min(900, screen.height)
        window = NSWindow(contentRect: NSRect(x: 0, y: 0, width: w, height: h),
                          styleMask: [.titled, .closable, .miniaturizable, .resizable],
                          backing: .buffered, defer: false)
        window.title = "Standard-Financial-Charting"
        window.minSize = minWindowSize
        window.appearance = NSAppearance(named: .darkAqua)
        window.backgroundColor = sfcBG
        window.isReleasedWhenClosed = false
        window.center()
        if !selfTestMode {
            window.setFrameAutosaveName("SFCMain")  // restores a saved frame, if any
            window.setFrame(clampFrame(window.frame, screens: NSScreen.screens.map { $0.visibleFrame }, minSize: minWindowSize),
                            display: false)
        }

        let content = NSView(frame: window.contentView!.bounds)
        content.wantsLayer = true
        content.layer?.backgroundColor = sfcBG.cgColor
        content.autoresizingMask = [.width, .height]
        window.contentView = content

        statusLabel = NSTextField(labelWithString: "Starting…")
        statusLabel.textColor = sfcMuted
        statusLabel.font = NSFont.systemFont(ofSize: 13)
        statusLabel.autoresizingMask = [.minXMargin, .maxXMargin, .minYMargin, .maxYMargin]
        content.addSubview(statusLabel)
        showStatus("Starting…")

        let cfg = WKWebViewConfiguration()
        webView = WKWebView(frame: content.bounds, configuration: cfg)
        webView.autoresizingMask = [.width, .height]
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.alphaValue = 0
        if #available(macOS 12.0, *) { webView.underPageBackgroundColor = sfcBG }
        if debugMode, #available(macOS 13.3, *) { webView.isInspectable = true }
        content.addSubview(webView)

        if selfTestMode {
            window.alphaValue = selfTestSnapshot == nil ? 0.01 : 1  // snapshot mode shows the real window
            window.orderFrontRegardless()
        } else {
            window.makeKeyAndOrderFront(nil)
        }
    }

    func showStatus(_ text: String) {
        statusLabel.stringValue = text
        statusLabel.sizeToFit()
        let b = window.contentView!.bounds
        statusLabel.frame.origin = NSPoint(x: (b.width - statusLabel.frame.width) / 2, y: (b.height - statusLabel.frame.height) / 2)
        statusLabel.isHidden = false
    }

    func buildMenu() {
        let main = NSMenu()
        func add(_ menu: NSMenu, _ title: String, _ sel: Selector?, _ key: String,
                 _ mods: NSEvent.ModifierFlags = [.command]) {
            let item = NSMenuItem(title: title, action: sel, keyEquivalent: key)
            item.keyEquivalentModifierMask = mods
            menu.addItem(item)
        }
        func submenu(_ title: String) -> NSMenu {
            let item = NSMenuItem(); main.addItem(item)
            let m = NSMenu(title: title); item.submenu = m
            return m
        }
        let app = submenu("Standard-Financial-Charting")
        add(app, "关于 Standard-Financial-Charting", #selector(showAbout), "")
        app.addItem(.separator())
        add(app, "隐藏 Standard-Financial-Charting", #selector(NSApplication.hide(_:)), "h")
        add(app, "隐藏其他", #selector(NSApplication.hideOtherApplications(_:)), "h", [.command, .option])
        add(app, "全部显示", #selector(NSApplication.unhideAllApplications(_:)), "")
        app.addItem(.separator())
        add(app, "退出 Standard-Financial-Charting", #selector(NSApplication.terminate(_:)), "q")

        let edit = submenu("编辑")
        add(edit, "撤销", Selector(("undo:")), "z")
        add(edit, "重做", Selector(("redo:")), "z", [.command, .shift])
        edit.addItem(.separator())
        add(edit, "剪切", #selector(NSText.cut(_:)), "x")
        add(edit, "拷贝", #selector(NSText.copy(_:)), "c")
        add(edit, "粘贴", #selector(NSText.paste(_:)), "v")
        add(edit, "全选", #selector(NSText.selectAll(_:)), "a")

        let view = submenu("视图")
        add(view, "重新载入", #selector(reloadPage), "r")
        add(view, "进入全屏", #selector(NSWindow.toggleFullScreen(_:)), "f", [.command, .control])

        let win = submenu("窗口")
        add(win, "最小化", #selector(NSWindow.performMiniaturize(_:)), "m")
        add(win, "缩放", #selector(NSWindow.performZoom(_:)), "")
        NSApp.windowsMenu = win

        let help = submenu("帮助")
        add(help, "显示日志", #selector(revealLog), "")
        add(help, "显示数据文件夹", #selector(revealData), "")
        NSApp.helpMenu = help
        NSApp.mainMenu = main
    }

    @objc func showAbout() {
        let short = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? ""
        let credits = NSAttributedString(string: "数据与计算全部在本机。",
                                         attributes: [.font: NSFont.systemFont(ofSize: 11)])
        NSApp.orderFrontStandardAboutPanel(options: [
            .applicationName: "Standard-Financial-Charting", .applicationVersion: short, .credits: credits,
        ])
    }

    @objc func reloadPage() { if state == .running { webView.reload() } }

    @objc func revealLog() {
        let url = FileManager.default.fileExists(atPath: paths.logURL.path) ? paths.logURL : paths.logDir
        if selfTestMode { selfTestLogsTarget = url.path; return }
        NSWorkspace.shared.activateFileViewerSelecting([url])
    }

    @objc func revealData() {
        if selfTestMode { return }
        NSWorkspace.shared.activateFileViewerSelecting([paths.dataDir])
    }

    // lifecycle --------------------------------------------------------------
    func logPath() -> String { paths.logURL.path }

    /// One start path for cold start, retry and crash recovery.
    func start(attempt: Int, restart: Bool) {
        gen += 1
        let g = gen
        state = .starting
        hidePanel()
        showStatus(restart ? "Restarting…" : "Starting…")
        guard dirsOK else {
            fail(.exitedEarly(reason: "无法创建数据目录 \(paths.dataDir.path)", log: logPath()))
            return
        }
        guard let res = AppResources.locate() else { fail(.resourcesMissing); return }
        bundled = res.bundled
        let probe = PythonProbe.find()
        guard let python = probe.path else { fail(.noPython); return }
        let b = backend ?? BackendProc(res: res, python: python, paths: paths)
        backend = b
        b.onUnexpectedExit = { [weak self] in
            guard let self = self, !selfTestMode, self.state == .running else { return }
            self.recover(reason: "exited")
        }
        let note = restart ? "restart" : "start (attempt \(attempt), \(res.bundled ? "bundled" : "repo-adjacent"))"
        guard b.spawn(note: note) else {
            fail(.exitedEarly(reason: "无法拉起内置后端进程", log: logPath()))
            return
        }
        let firstRun = (try? FileManager.default.attributesOfItem(atPath: paths.dbURL.path)[.size] as? Int ?? 0) ?? 0
        let timeout: TimeInterval = (!restart && firstRun == 0) ? 30 : 15
        b.waitReady(timeout: timeout) { result in
            guard g == self.gen else { return }
            switch result {
            case .ready:
                self.state = .running
                self.load(port: b.port)
                self.startHeartbeat()
            case .exited:
                let summary = b.failureSummary()
                if attempt < 3 && summary.contains("Address already in use") {
                    b.shutdown()
                    self.start(attempt: attempt + 1, restart: restart)  // port race: new port
                } else {
                    self.fail(.exitedEarly(reason: summary, log: self.logPath()))
                }
            case .timeout:
                self.fail(.readyTimeout(seconds: Int(timeout), log: self.logPath()))
            }
        }
    }

    func load(port: Int) {
        guard let url = URL(string: "http://127.0.0.1:\(port)\(selfTestPath)") else { return }
        webView.load(URLRequest(url: url))
    }

    /// Back end exited on its own or was judged hung: restart on a new port, at most 3 times per rolling 60 s.
    func recover(reason: String) {
        gen += 1
        stopHeartbeat()
        state = .restarting
        let now = Date()
        restartTimes = restartTimes.filter { now.timeIntervalSince($0) < 60 }
        if restartTimes.count >= 3 {
            fail(.backendStopped(log: logPath()))
            return
        }
        restartTimes.append(now)
        backend?.appendLog(shellNote("restart \(restartTimes.count)/3 (\(reason))"))
        start(attempt: 1, restart: true)
    }

    // supervision (regular mode only) ------------------------------------------
    func startHeartbeat() {
        stopHeartbeat()
        guard !selfTestMode else { return }
        heartbeatFails = 0
        heartbeatTimer = Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { [weak self] _ in self?.beat() }
    }

    func stopHeartbeat() {
        heartbeatTimer?.invalidate()
        heartbeatTimer = nil
    }

    func beat() {
        guard state == .running, let b = backend, b.isRunning else { return }
        let g = gen
        b.heartbeat { ok in
            guard g == self.gen, self.state == .running else { return }
            if ok { self.heartbeatFails = 0; return }
            self.heartbeatFails += 1
            if self.heartbeatFails >= 3 {
                b.appendLog(shellNote("health check failed 3x, treating back end as hung"))
                self.gen += 1
                self.state = .restarting
                b.killForRestart()
                self.recover(reason: "hung")
            }
        }
    }

    // error panel --------------------------------------------------------------
    func fail(_ failure: StartFailure) {
        gen += 1
        stopHeartbeat()
        state = .panel
        backend?.shutdown()
        hidePanel()
        statusLabel.isHidden = true
        webView.alphaValue = 0
        let panel = ErrorPanel(frame: window.contentView!.bounds, failure: failure, target: self,
                               retry: #selector(retryTapped), logs: #selector(revealLog), quit: #selector(quitTapped))
        window.contentView?.addSubview(panel)
        panelView = panel
        if selfTestMode { selfTestPanelReached(failure) }
    }

    func hidePanel() {
        panelView?.removeFromSuperview()
        panelView = nil
    }

    @objc func retryTapped() {
        if selfTestMode { selfTestRetries += 1 }
        restartTimes.removeAll()
        backend?.shutdown()
        start(attempt: 1, restart: false)
    }

    @objc func quitTapped() {
        if selfTestMode { selfTestQuitClicked = true; return }
        NSApp.terminate(nil)
    }

    func cleanup() {
        if cleaned { return }
        cleaned = true
        stopHeartbeat()
        backend?.shutdown()
    }

    func applicationShouldTerminate(_ sender: NSApplication) -> NSApplication.TerminateReply {
        if selfTestCloseMode && !selfTestResult.isEmpty { selfTestFinishAfterClose() }
        cleanup()
        return .terminateNow
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool { true }

    func installSignalHandlers() {
        for sig in [SIGTERM, SIGINT, SIGHUP] {
            signal(sig, SIG_IGN)
            let src = DispatchSource.makeSignalSource(signal: sig, queue: .main)
            src.setEventHandler { NSApp.terminate(nil) }
            src.resume()
            sigSources.append(src)
        }
    }

    // navigation policy (loopback only) --------------------------------------
    func isOwnPage(_ url: URL?) -> Bool {
        guard let u = url, let b = backend else { return false }
        return u.scheme == "http" && u.host == "127.0.0.1" && u.port == b.port
    }

    func openExternally(_ url: URL?) {
        guard let u = url, let s = u.scheme?.lowercased(), ["http", "https", "mailto"].contains(s) else { return }
        NSWorkspace.shared.open(u)
    }

    func webView(_ webView: WKWebView, decidePolicyFor action: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        let url = action.request.url
        if isOwnPage(url) || url?.absoluteString == "about:blank" {
            decisionHandler(.allow)
        } else {
            openExternally(url)
            decisionHandler(.cancel)
        }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration,
                 for action: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        let url = action.request.url
        if isOwnPage(url) { webView.load(action.request) } else { openExternally(url) }
        return nil
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        guard state == .running else { return }
        webView.alphaValue = 1
        statusLabel.isHidden = true
        if selfTestMode && !selfTestProbed {
            selfTestProbed = true
            // Give the page time to render (cube needs a moment), then probe / snapshot.
            DispatchQueue.main.asyncAfter(deadline: .now() + (selfTestSnapshot == nil ? 1 : 3)) { self.runSelfTestProbe() }
        }
    }

    func pageFailed(_ error: Error) {
        if (error as NSError).code == NSURLErrorCancelled || state != .running { return }
        fail(.pageLoad(message: error.localizedDescription, log: logPath()))
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        pageFailed(error)
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        pageFailed(error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        let now = Date()
        webCrashTimes = webCrashTimes.filter { now.timeIntervalSince($0) < 30 }
        if webCrashTimes.isEmpty {
            webCrashTimes.append(now)
            webView.reload()
        } else {
            fail(.pageLoad(message: "页面进程多次意外退出。", log: logPath()))
        }
    }

    // JS dialogs (so page alert/confirm keep working in the shell)
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let a = NSAlert(); a.messageText = message; a.addButton(withTitle: "好")
        a.runModal(); completionHandler()
    }

    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let a = NSAlert(); a.messageText = message
        a.addButton(withTitle: "好"); a.addButton(withTitle: "取消")
        completionHandler(a.runModal() == .alertFirstButtonReturn)
    }
}
