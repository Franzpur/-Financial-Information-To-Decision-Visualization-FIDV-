// SHELL-WINDOW : in-window native error panel (not a web page, no script bridge).
// Uses the existing AESTHETIC tokens only: --bg #0b0d10, --muted #9aa6b5, system font, system buttons.
import Cocoa

let sfcBG = NSColor(srgbRed: 0x0b / 255.0, green: 0x0d / 255.0, blue: 0x10 / 255.0, alpha: 1)
let sfcMuted = NSColor(srgbRed: 0x9a / 255.0, green: 0xa6 / 255.0, blue: 0xb5 / 255.0, alpha: 1)

enum StartFailure {
    case resourcesMissing
    case noPython
    case readyTimeout(seconds: Int, log: String)
    case exitedEarly(reason: String, log: String)
    case backendStopped(log: String)
    case pageLoad(message: String, log: String)

    var title: String {
        switch self {
        case .resourcesMissing: return "找不到应用文件"
        case .noPython: return "需要 Python 3.9+"
        case .readyTimeout: return "后端启动超时"
        case .exitedEarly: return "后端无法启动"
        case .backendStopped: return "后端已停止"
        case .pageLoad: return "页面无法载入"
        }
    }

    var detail: String {
        switch self {
        case .resourcesMissing:
            return "应用包不完整或已被移动。仓内开发版须放在 SFC 仓库根目录（与 Ind-Chain/ 同级）；分发版请重新解压完整的应用。"
        case .noPython:
            return "本应用需要本机已安装 Python 3.9 或更高版本。请在终端运行 xcode-select --install 安装 Xcode Command Line Tools，装好后点「重试」。"
        case let .readyTimeout(seconds, log):
            return "内置后端在 \(seconds) 秒内没有就绪。可点「显示日志」查看原因，或点「重试」。\n日志：\(log)"
        case let .exitedEarly(reason, log):
            return "内置后端启动后立即退出。\n原因：\(reason)\n日志：\(log)"
        case let .backendStopped(log):
            return "内置后端在运行中多次退出，已停止自动重启（60 秒内最多 3 次）。可点「重试」再试一次。\n日志：\(log)"
        case let .pageLoad(message, log):
            return "页面载入失败：\(message)\n日志：\(log)"
        }
    }
}

final class ErrorPanel: NSView {
    static let buttonTitles = ["重试", "显示日志", "退出"]
    private(set) var buttons: [NSButton] = []

    init(frame: NSRect, failure: StartFailure, target: AnyObject, retry: Selector, logs: Selector, quit: Selector) {
        super.init(frame: frame)
        wantsLayer = true
        layer?.backgroundColor = sfcBG.cgColor
        autoresizingMask = [.width, .height]

        let title = NSTextField(labelWithString: failure.title)
        title.font = NSFont.systemFont(ofSize: 20, weight: .semibold)
        title.textColor = NSColor(white: 0.92, alpha: 1)
        title.alignment = .center

        let detail = NSTextField(wrappingLabelWithString: failure.detail)
        detail.font = NSFont.systemFont(ofSize: 13)
        detail.textColor = sfcMuted
        detail.alignment = .center
        detail.isSelectable = true
        detail.preferredMaxLayoutWidth = 520

        let selectors = [retry, logs, quit]
        buttons = zip(ErrorPanel.buttonTitles, selectors).map { title, sel in
            let b = NSButton(title: title, target: target, action: sel)
            b.bezelStyle = .rounded
            return b
        }
        let row = NSStackView(views: buttons)
        row.orientation = .horizontal
        row.spacing = 12

        let stack = NSStackView(views: [title, detail, row])
        stack.orientation = .vertical
        stack.alignment = .centerX
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false
        addSubview(stack)
        NSLayoutConstraint.activate([
            stack.centerXAnchor.constraint(equalTo: centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: centerYAnchor),
            stack.widthAnchor.constraint(lessThanOrEqualToConstant: 560),
        ])
        appearance = NSAppearance(named: .darkAqua)
    }

    required init?(coder: NSCoder) { fatalError("not used") }
}
