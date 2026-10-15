// --selftest : diagnostics for automation (not a user feature). Prints one JSON object and exits.
//   --start-path /x        page to open          --snapshot out.png      write a PNG of this process's own view
//   --selftest-click B     press panel button B (retry|logs|quit)         --selftest-close  close via performClose
//   --selftest-frame x,y,w,h   report the clamped frame                    --selftest-keep-data  use the real data dir
// The probe uses callAsyncJavaScript here only; the page never gets a native bridge.
import Cocoa
import WebKit

/// Pixel statistics of a snapshot against the page background (#0b0d10) and, for /cube, the canvas centre.
func analyzeSnapshot(_ cg: CGImage, viewWidth: CGFloat, canvasRect: [Double]?) -> (nonBg: Double, webglDrawn: Bool?) {
    let w = cg.width, h = cg.height
    guard w > 0, h > 0, let space = CGColorSpace(name: CGColorSpace.sRGB),
          let ctx = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: space,
                              bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue),
          let data = ctx.data else { return (0, nil) }
    ctx.draw(cg, in: CGRect(x: 0, y: 0, width: w, height: h))
    let px = data.bindMemory(to: UInt8.self, capacity: w * h * 4)  // row 0 = top of the image
    func diff(_ x: Int, _ y: Int, _ ref: (Int, Int, Int)) -> Int {
        let o = (y * w + x) * 4
        return max(abs(Int(px[o]) - ref.0), abs(Int(px[o + 1]) - ref.1), abs(Int(px[o + 2]) - ref.2))
    }
    let bg = (0x0b, 0x0d, 0x10)
    var far = 0
    for y in 0..<h { for x in 0..<w where diff(x, y, bg) >= 16 { far += 1 } }
    let nonBg = Double(far) / Double(w * h)

    guard let r = canvasRect, r.count == 4, r[2] > 8, r[3] > 8 else { return (nonBg, nil) }
    let s = Double(w) / Double(viewWidth)
    let cx0 = max(0, Int((r[0] + r[2] * 0.25) * s)), cx1 = min(w, Int((r[0] + r[2] * 0.75) * s))
    let cy0 = max(0, Int((r[1] + r[3] * 0.25) * s)), cy1 = min(h, Int((r[1] + r[3] * 0.75) * s))
    guard cx1 > cx0, cy1 > cy0 else { return (nonBg, nil) }
    // local background = mean of four small patches just inside the canvas corners
    var sum = (0, 0, 0), n = 0
    let inset = 6
    let xs = [max(0, Int(r[0] * s) + inset), min(w - 5, Int((r[0] + r[2]) * s) - inset - 4)]
    let ys = [max(0, Int(r[1] * s) + inset), min(h - 5, Int((r[1] + r[3]) * s) - inset - 4)]
    for px0 in xs { for py0 in ys { for dy in 0..<4 { for dx in 0..<4 {
        let o = ((py0 + dy) * w + px0 + dx) * 4
        sum.0 += Int(px[o]); sum.1 += Int(px[o + 1]); sum.2 += Int(px[o + 2]); n += 1
    } } } }
    let local = (sum.0 / n, sum.1 / n, sum.2 / n)
    var off = 0
    for y in cy0..<cy1 { for x in cx0..<cx1 where diff(x, y, local) >= 16 { off += 1 } }
    let ratio = Double(off) / Double((cx1 - cx0) * (cy1 - cy0))
    return (nonBg, ratio >= 0.01)
}

func writePNG(_ cg: CGImage, to path: String) -> Bool {
    let rep = NSBitmapImageRep(cgImage: cg)
    guard let png = rep.representation(using: .png, properties: [:]) else { return false }
    return (try? png.write(to: URL(fileURLWithPath: path))) != nil
}

extension AppDelegate {
    func runSelfTestProbe() {
        let js = """
        return await (async () => {
          let health = false;
          try { const r = await fetch('/api/health'); health = (await r.json()).ok === true; } catch (e) {}
          let webgl = false;
          try { webgl = !!document.createElement('canvas').getContext('webgl'); } catch (e) {}
          if (location.pathname.indexOf('/cube') === 0) {
            for (let i = 0; i < 100 && !document.querySelector('canvas'); i++) await new Promise(r => setTimeout(r, 100));
            await new Promise(r => setTimeout(r, 1500));
          }
          let rafTicks = 0;
          await new Promise(res => {
            const t0 = performance.now();
            const f = () => { rafTicks++; if (performance.now() - t0 < 500) requestAnimationFrame(f); else res(); };
            requestAnimationFrame(f);
            setTimeout(res, 1500);
          });
          const origin = location.origin;
          const external = performance.getEntriesByType('resource').filter(e => {
            try { return /^https?:/.test(e.name) && new URL(e.name).origin !== origin; } catch (_) { return false; }
          }).length;
          const c = document.querySelector('canvas');
          let canvasRect = null;
          if (c) { const r = c.getBoundingClientRect(); canvasRect = [r.x, r.y, r.width, r.height]; }
          return JSON.stringify({
            title: document.title,
            hasSplashOrHome: !!(document.getElementById('splash') || document.getElementById('sectorList')),
            webgl: webgl, health: health, canvases: document.querySelectorAll('canvas').length,
            external: external, rafTicks: rafTicks, visibility: document.visibilityState, canvasRect: canvasRect
          });
        })()
        """
        webView.callAsyncJavaScript(js, in: nil, in: .page) { result in
            switch result {
            case .success(let v):
                var out: [String: Any] = [:]
                if let s = v as? String, let d = s.data(using: .utf8),
                   let j = try? JSONSerialization.jsonObject(with: d) as? [String: Any] { out = j }
                self.finishProbe(out)
            case .failure(let e):
                self.finishSelfTest(["ok": false, "error": e.localizedDescription])
            }
        }
    }

    private func finishProbe(_ page: [String: Any]) {
        var out = page
        let rect = (page["canvasRect"] as? [Any])?.compactMap { ($0 as? NSNumber)?.doubleValue }
        out["canvasRect"] = rect ?? NSNull()
        webView.takeSnapshot(with: nil) { image, error in
            if let cg = image?.cgImage(forProposedRect: nil, context: nil, hints: nil) {
                let stats = analyzeSnapshot(cg, viewWidth: self.webView.bounds.width, canvasRect: rect)
                out["nonBgRatio"] = (stats.nonBg * 10000).rounded() / 10000
                out["webglDrawn"] = stats.webglDrawn.map { $0 as Any } ?? NSNull()
                if let path = self.selfTestSnapshot, writePNG(cg, to: path) { out["snapshot"] = path }
                out["snapshotMethod"] = "WKWebView.takeSnapshot"
            } else {
                out["snapshotError"] = error?.localizedDescription ?? "no image"
            }
            self.completeProbe(&out)
        }
    }

    private func completeProbe(_ out: inout [String: Any]) {
        out["port"] = backend?.port ?? 0
        out["pid"] = ProcessInfo.processInfo.processIdentifier
        out["backendPid"] = backend?.pid ?? 0
        out["dataDir"] = paths.dataDir.path
        out["bundled"] = bundled
        let probe = PythonProbe.find()
        out["pythonProbe"] = probe.trail
        out["pythonSource"] = probe.source
        out["pythonVersion"] = probe.version ?? ""
        let pageOK = selfTestPath != "/" || out["hasSplashOrHome"] as? Bool == true
        out["ok"] = (out["health"] as? Bool == true) && pageOK && (out["external"] as? Int ?? 0) == 0
        if let spec = argValue("--selftest-frame") {
            let n = spec.split(separator: ",").compactMap { Double($0) }
            if n.count == 4 {
                let f = clampFrame(NSRect(x: n[0], y: n[1], width: n[2], height: n[3]),
                                   screens: NSScreen.screens.map { $0.visibleFrame }, minSize: minWindowSize)
                out["clampedFrame"] = [f.minX, f.minY, f.width, f.height]
            }
        }
        if selfTestCloseMode {
            selfTestResult = out
            selfTestCloseStart = Date()
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                var late = self.selfTestResult
                late["ok"] = false
                late["closeExit"] = ["ok": false, "ms": 3000, "backendGone": false, "error": "no exit within 3 s"]
                self.printAndExit(late, code: 1)
            }
            window.performClose(nil)  // same AppKit path as the red close button
            return
        }
        finishSelfTest(out)
    }

    /// Called from applicationShouldTerminate after performClose: clean up, then report how long it took.
    func selfTestFinishAfterClose() {
        let pid = backend?.pid ?? 0
        cleanup()
        let ms = Int(Date().timeIntervalSince(selfTestCloseStart) * 1000)
        let gone = pid == 0 || (kill(pid, 0) == -1 && errno == ESRCH)
        var out = selfTestResult
        let ok = gone && ms <= 3000
        out["closeExit"] = ["ok": ok, "ms": ms, "backendGone": gone]
        out["ok"] = (out["ok"] as? Bool == true) && ok
        printAndExit(out, code: (out["ok"] as? Bool == true) ? 0 : 1)
    }

    /// Error panel reached while self-testing: report the panel text, optionally press a button.
    func selfTestPanelReached(_ f: StartFailure) {
        let click = selfTestClick
        let idx = ["retry": 0, "logs": 1, "quit": 2][click ?? ""]
        if click == "retry" && selfTestRetries == 0, let b = panelView?.buttons[0] {
            b.performClick(nil)  // second panel arrives after the retry ran the same start path
            return
        }
        if let i = idx, i > 0, let b = panelView?.buttons[i] { b.performClick(nil) }
        var out: [String: Any] = [
            "ok": false, "error": f.title + " — " + f.detail,
            "panel": ["title": f.title, "detail": f.detail, "buttons": ErrorPanel.buttonTitles],
            "retries": selfTestRetries, "backendAlive": backend?.isRunning ?? false,
            "pythonProbe": PythonProbe.find().trail, "dataDir": paths.dataDir.path,
        ]
        if let t = selfTestLogsTarget { out["logsTarget"] = t }
        if selfTestQuitClicked { out["quitClicked"] = true }
        if let path = selfTestSnapshot, let panel = panelView, let rep = panel.bitmapImageRepForCachingDisplay(in: panel.bounds) {
            panel.cacheDisplay(in: panel.bounds, to: rep)
            if let cg = rep.cgImage, writePNG(cg, to: path) { out["snapshot"] = path }
        }
        finishSelfTest(out)
    }

    func finishSelfTest(_ result: [String: Any]) {
        printAndExit(result, code: (result["ok"] as? Bool == true) ? 0 : 1)
    }

    private func printAndExit(_ result: [String: Any], code: Int32) {
        if selfTestDone { return }
        selfTestDone = true
        if let d = try? JSONSerialization.data(withJSONObject: result, options: [.sortedKeys]),
           let s = String(data: d, encoding: .utf8) { print(s) }
        fflush(stdout)
        cleanup()
        if let t = paths.tempRoot { try? FileManager.default.removeItem(at: t) }
        exit(code)
    }
}
