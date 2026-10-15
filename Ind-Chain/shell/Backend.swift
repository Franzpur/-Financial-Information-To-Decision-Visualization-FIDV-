// SHELL-PROC : paths, single-instance lock, Python probe and the embedded back-end child process.
// The shell owns exactly one child (server/app.py); every kill goes through BackendProc, never by port or name.
import Foundation

// MARK: - command line / environment (diagnostics only honoured together with --selftest)
let selfTestMode = CommandLine.arguments.contains("--selftest")
let debugMode = ProcessInfo.processInfo.environment["SFC_DEBUG"] == "1"

func argValue(_ flag: String) -> String? {
    let a = CommandLine.arguments
    guard let i = a.firstIndex(of: flag), i + 1 < a.count else { return nil }
    return a[i + 1]
}

func shellNote(_ text: String) -> String {
    "[SFC-shell \(ISO8601DateFormatter().string(from: Date()))] \(text)\n"
}

// MARK: - user directories (HOME-derived so tests can redirect them)
struct SFCPaths {
    let dataDir: URL
    let logDir: URL
    let tempRoot: URL?  // self-test scratch, removed on exit

    var logURL: URL { logDir.appendingPathComponent("backend.log") }
    var dbURL: URL { dataDir.appendingPathComponent("ind_chain.db") }
    var lockURL: URL { dataDir.appendingPathComponent(".sfc-instance.lock") }

    static func make() -> SFCPaths {
        if selfTestMode && !CommandLine.arguments.contains("--selftest-keep-data") {
            let t = URL(fileURLWithPath: NSTemporaryDirectory())
                .appendingPathComponent("sfc-selftest-\(ProcessInfo.processInfo.processIdentifier)")
            return SFCPaths(dataDir: t.appendingPathComponent("data"), logDir: t.appendingPathComponent("logs"), tempRoot: t)
        }
        let home = ProcessInfo.processInfo.environment["HOME"] ?? NSHomeDirectory()
        let h = URL(fileURLWithPath: home)
        return SFCPaths(
            dataDir: h.appendingPathComponent("Library/Application Support/Standard-Financial-Charting"),
            logDir: h.appendingPathComponent("Library/Logs/Standard-Financial-Charting"), tempRoot: nil)
    }

    /// Create both directories (0700, also re-applied when they already exist).
    func ensureDirs() -> Bool {
        let fm = FileManager.default
        for d in [dataDir, logDir] {
            do {
                try fm.createDirectory(at: d, withIntermediateDirectories: true, attributes: [.posixPermissions: 0o700])
                try fm.setAttributes([.posixPermissions: 0o700], ofItemAtPath: d.path)
            } catch { return false }
        }
        return true
    }
}

// MARK: - application resources (bundled package first, repo-adjacent second)
struct AppResources {
    let root: URL  // contains Ind-Chain/server/app.py
    let bundled: Bool

    var appPy: URL { root.appendingPathComponent("Ind-Chain/server/app.py") }
    var cwd: URL { root.appendingPathComponent("Ind-Chain") }

    static func locate() -> AppResources? {
        let fm = FileManager.default
        if let res = Bundle.main.resourceURL?.appendingPathComponent("sfc"),
           fm.fileExists(atPath: res.appendingPathComponent("Ind-Chain/server/app.py").path) {
            return AppResources(root: res, bundled: true)
        }
        guard let exe = Bundle.main.executablePath else { return nil }
        let real = URL(fileURLWithPath: (exe as NSString).resolvingSymlinksInPath)
        // .../X.app/Contents/MacOS/exe -> up 4 = directory that holds X.app
        let root = real.deletingLastPathComponent().deletingLastPathComponent()
            .deletingLastPathComponent().deletingLastPathComponent()
        if fm.fileExists(atPath: root.appendingPathComponent("Ind-Chain/server/app.py").path) {
            return AppResources(root: root, bundled: false)
        }
        return nil
    }
}

// MARK: - single instance (process-level flock; Launch Services does the first line of defence)
final class InstanceLock {
    private var fd: Int32 = -1

    /// True when this process now holds the lock for its whole lifetime (O_CLOEXEC: the child never inherits it).
    func acquire(at url: URL) -> Bool {
        fd = open(url.path, O_RDWR | O_CREAT | O_CLOEXEC, 0o600)
        if fd < 0 { return true }  // cannot even create the lock file: do not block the user
        if flock(fd, LOCK_EX | LOCK_NB) == 0 { return true }
        close(fd)
        fd = -1
        return false
    }
}

// MARK: - port
func freeLoopbackPort() -> Int? {
    let fd = socket(AF_INET, SOCK_STREAM, 0)
    if fd < 0 { return nil }
    defer { close(fd) }
    var addr = sockaddr_in()
    addr.sin_len = UInt8(MemoryLayout<sockaddr_in>.size)
    addr.sin_family = sa_family_t(AF_INET)
    addr.sin_port = 0
    addr.sin_addr.s_addr = inet_addr("127.0.0.1")
    let bound = withUnsafePointer(to: &addr) {
        $0.withMemoryRebound(to: sockaddr.self, capacity: 1) {
            bind(fd, $0, socklen_t(MemoryLayout<sockaddr_in>.size))
        }
    }
    if bound != 0 { return nil }
    var out = sockaddr_in()
    var len = socklen_t(MemoryLayout<sockaddr_in>.size)
    let got = withUnsafeMutablePointer(to: &out) {
        $0.withMemoryRebound(to: sockaddr.self, capacity: 1) { getsockname(fd, $0, &len) }
    }
    if got != 0 { return nil }
    return Int(UInt16(bigEndian: out.sin_port))
}

// MARK: - Python probe (bundled runtime first, then system candidates; never the /usr/bin/python3 shim without Command Line Tools)
struct PythonProbe {
    var path: String?
    var version: String?
    var source = "none"  // bundled | system | none
    var trail: [[String: String]] = []

    private static let defaults = ["/usr/bin/python3", "/opt/homebrew/bin/python3", "/usr/local/bin/python3"]
    private static var cached: PythonProbe?
    private static var lastFailure = ""  // last stderr line of a failed probe, for backend.log

    /// Contents/Frameworks/Python.framework/Versions/Current/bin/python3 inside this app, when it was packaged with one.
    static var bundledPath: String {
        Bundle.main.bundleURL.appendingPathComponent("Contents/Frameworks/Python.framework/Versions/Current/bin/python3").path
    }

    private static func hasCommandLineTools() -> Bool {
        if selfTestMode && ProcessInfo.processInfo.environment["SFC_ASSUME_NO_CLT"] == "1" { return false }
        let fm = FileManager.default
        return fm.isExecutableFile(atPath: "/Library/Developer/CommandLineTools/usr/bin/python3")
            || fm.isExecutableFile(atPath: "/Applications/Xcode.app/Contents/Developer/usr/bin/python3")
    }

    /// "3.14.8" when the interpreter runs and is at least 3.9, else nil.
    private static func versionIfUsable(_ path: String) -> String? {
        let p = Process()
        p.executableURL = URL(fileURLWithPath: path)
        p.arguments = ["-I", "-c", "import sys, sqlite3; v = sys.version_info; print('%d.%d.%d' % v[:3]); sys.exit(0 if v >= (3, 9) else 1)"]
        let out = Pipe()
        p.standardOutput = out
        let err = Pipe()
        p.standardError = err
        p.environment = sanitizedPythonEnvironment(ProcessInfo.processInfo.environment)
        do { try p.run() } catch { return nil }
        let data = out.fileHandleForReading.readDataToEndOfFile()
        let errData = err.fileHandleForReading.readDataToEndOfFile()
        p.waitUntilExit()
        guard p.terminationStatus == 0 else {
            lastFailure = String(data: errData, encoding: .utf8)?.split(separator: "\n").last.map(String.init) ?? "exit \(p.terminationStatus)"
            return nil
        }
        return String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
    }

    static func find() -> PythonProbe {
        if let c = cached { return c }
        var result = PythonProbe()
        let fm = FileManager.default
        let ignoreBundled = selfTestMode && ProcessInfo.processInfo.environment["SFC_IGNORE_BUNDLED_PYTHON"] == "1"
        if ignoreBundled {
            result.trail.append(["path": bundledPath, "action": "ignored-by-selftest"])
        } else if fm.isExecutableFile(atPath: bundledPath) {
            if let v = versionIfUsable(bundledPath) {
                result.trail.append(["path": bundledPath, "action": "exec-ok", "source": "bundled"])
                result.path = bundledPath; result.version = v; result.source = "bundled"
                cached = result
                return result
            }
            result.trail.append(["path": bundledPath, "action": "bundled-unusable", "reason": lastFailure])
        }
        var candidates = defaults
        if selfTestMode, let raw = ProcessInfo.processInfo.environment["SFC_PYTHON_CANDIDATES"] {
            let allowed = Set(raw.split(separator: ":").map(String.init))  // may only narrow the list
            candidates = defaults.filter { allowed.contains($0) }
        }
        for c in candidates {
            if !fm.isExecutableFile(atPath: c) { result.trail.append(["path": c, "action": "missing"]); continue }
            if c == "/usr/bin/python3" && !hasCommandLineTools() {
                result.trail.append(["path": c, "action": "skipped-shim"]); continue
            }
            if let v = versionIfUsable(c) {
                result.trail.append(["path": c, "action": "exec-ok", "source": "system"])
                result.path = c; result.version = v; result.source = "system"
                break
            }
            result.trail.append(["path": c, "action": "exec-too-old"])
        }
        cached = result
        return result
    }
}

/// The user's shell must not steer our interpreter (a PYTHONHOME of another install would break the bundled one).
/// Applied to every interpreter, system ones too (deliberate, small deviation from "system path unchanged"; their server is stdlib-only).
func sanitizedPythonEnvironment(_ base: [String: String]) -> [String: String] {
    var env = base
    for k in env.keys where k.hasPrefix("PYTHON") || k.hasPrefix("DYLD_") || k.hasPrefix("__PYVENV") || k == "VIRTUAL_ENV" { env.removeValue(forKey: k) }
    env["PYTHONNOUSERSITE"] = "1"
    return env
}

// MARK: - SHELL-PROC : embedded back end
enum ReadyResult { case ready, exited, timeout }

final class BackendProc {
    private(set) var process: Process?
    private(set) var port = 0
    private var expectedExit = false
    private static var logRotated = false  // once per shell process; restarts append
    private let res: AppResources
    private let python: String
    let paths: SFCPaths
    var onUnexpectedExit: (() -> Void)?

    init(res: AppResources, python: String, paths: SFCPaths) {
        self.res = res
        self.python = python
        self.paths = paths
    }

    var isRunning: Bool { process?.isRunning ?? false }
    var pid: Int32 { process?.processIdentifier ?? 0 }

    func appendLog(_ text: String) {
        guard let h = try? FileHandle(forWritingTo: paths.logURL) else { return }
        h.seekToEndOfFile()
        h.write(Data(text.utf8))
        try? h.close()
    }

    private func openLog() -> FileHandle? {
        let fm = FileManager.default
        if !BackendProc.logRotated {
            BackendProc.logRotated = true
            let prev = paths.logDir.appendingPathComponent("backend.prev.log")
            if fm.fileExists(atPath: paths.logURL.path) {
                try? fm.removeItem(at: prev)
                try? fm.moveItem(at: paths.logURL, to: prev)
            }
        }
        if !fm.fileExists(atPath: paths.logURL.path) {
            fm.createFile(atPath: paths.logURL.path, contents: nil, attributes: [.posixPermissions: 0o600])
        }
        guard let h = try? FileHandle(forWritingTo: paths.logURL) else { return nil }
        h.seekToEndOfFile()
        return h
    }

    /// Spawn one child on a fresh port (an older child, if any, is cleared first: never two back ends).
    func spawn(note: String) -> Bool {
        if isRunning { killChild() }
        guard let p = freeLoopbackPort() else { return false }
        let log = openLog()
        log?.write(Data(shellNote(note).utf8))
        let probe = PythonProbe.find()
        log?.write(Data(shellNote("python=\(python) version=\(probe.version ?? "?") source=\(probe.source)").utf8))
        if let bad = probe.trail.first(where: { $0["action"] == "bundled-unusable" }) {
            log?.write(Data(shellNote("bundled Python unusable (\(bad["path"] ?? "?"): \(bad["reason"] ?? "?")); fell back to the system Python").utf8))
        }
        let proc = Process()
        proc.executableURL = URL(fileURLWithPath: python)
        proc.arguments = [res.appPy.path]
        proc.currentDirectoryURL = res.cwd
        var env = sanitizedPythonEnvironment(ProcessInfo.processInfo.environment)
        env["SFC_PORT"] = String(p)
        env["SFC_PARENT_PID"] = String(ProcessInfo.processInfo.processIdentifier)
        env["SFC_DATA_DIR"] = paths.dataDir.path
        env["PYTHONUNBUFFERED"] = "1"
        if res.bundled { env["PYTHONDONTWRITEBYTECODE"] = "1" }  // never write into the signed .app
        proc.environment = env
        proc.standardOutput = log ?? FileHandle.nullDevice
        proc.standardError = log ?? FileHandle.nullDevice
        expectedExit = false
        proc.terminationHandler = { [weak self] done in
            DispatchQueue.main.async {
                guard let self = self, self.process === done, !self.expectedExit else { return }
                self.onUnexpectedExit?()
            }
        }
        do { try proc.run() } catch { return false }
        try? log?.close()
        process = proc
        port = p
        return true
    }

    /// SIGTERM, wait up to 2 s, then SIGKILL. Only ever touches our own child.
    private func killChild() {
        guard let proc = process, proc.isRunning else { return }
        proc.terminate()
        let deadline = Date().addingTimeInterval(2.0)
        while proc.isRunning && Date() < deadline { usleep(50_000) }
        if proc.isRunning { kill(proc.processIdentifier, SIGKILL) }
        let hard = Date().addingTimeInterval(1.0)
        while proc.isRunning && Date() < hard { usleep(20_000) }
    }

    /// The one intentional clean-up path (quit, retry, restart budget spent).
    func shutdown() {
        expectedExit = true
        killChild()
    }

    /// Poll /api/health until ok:true while the child is alive.
    func waitReady(timeout: TimeInterval, _ done: @escaping (ReadyResult) -> Void) {
        let deadline = Date().addingTimeInterval(timeout)
        let cfg = URLSessionConfiguration.ephemeral
        cfg.timeoutIntervalForRequest = 1
        let session = URLSession(configuration: cfg)
        guard let url = URL(string: "http://127.0.0.1:\(port)/api/health") else { done(.exited); return }
        func tick() {
            if !self.isRunning { done(.exited); return }
            if Date() > deadline { done(.timeout); return }
            session.dataTask(with: url) { data, resp, _ in
                DispatchQueue.main.async {
                    if let d = data, let h = resp as? HTTPURLResponse, h.statusCode == 200,
                       let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any],
                       j["ok"] as? Bool == true, self.isRunning {
                        done(.ready)
                    } else {
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { tick() }
                    }
                }
            }.resume()
        }
        tick()
    }

    /// One heartbeat probe (2 s timeout) for the hung-back-end watchdog.
    func heartbeat(_ done: @escaping (Bool) -> Void) {
        guard let url = URL(string: "http://127.0.0.1:\(port)/api/health") else { done(false); return }
        let cfg = URLSessionConfiguration.ephemeral
        cfg.timeoutIntervalForRequest = 2
        URLSession(configuration: cfg).dataTask(with: url) { data, resp, _ in
            var ok = false
            if let d = data, let h = resp as? HTTPURLResponse, h.statusCode == 200,
               let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any], j["ok"] as? Bool == true { ok = true }
            DispatchQueue.main.async { done(ok) }
        }.resume()
    }

    /// Hung back end: clear it without marking the exit as intentional (the supervisor then restarts).
    func killForRestart() { killChild() }

    /// Short cause for the error panel: last exception line, else last [Ind-Chain] line, else last line.
    func failureSummary() -> String {
        guard let text = try? String(contentsOf: paths.logURL, encoding: .utf8) else { return "（日志为空）" }
        let lines = text.split(separator: "\n", omittingEmptySubsequences: true).map(String.init)
            .filter { !$0.hasPrefix("[SFC-shell") }
        let tail = Array(lines.suffix(20))
        if tail.contains(where: { $0.hasPrefix("Traceback") }), let last = tail.last { return last }
        if let line = tail.last(where: { $0.hasPrefix("[Ind-Chain]") }) { return line }
        return tail.last ?? "（日志为空）"
    }
}
