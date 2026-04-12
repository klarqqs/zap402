import React, { useCallback } from "react";
import { Download, QrCode } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

import Button from "@/components/primitives/Button";
import { useDocumentTheme } from "@/hooks/useDocumentTheme";

interface QRCodeProps {
  url: string;
  size?: number;
}

const CANVAS_ID = "tipz-qr-canvas";

const QRCode: React.FC<QRCodeProps> = ({ url, size = 200 }) => {
  const theme = useDocumentTheme();
  const qrBg = theme === "light" ? "#ffffff" : "#0d1210";
  const qrFg = theme === "light" ? "#0a1a0c" : "#d4ddd4";

  const downloadQRCode = useCallback(() => {
    const canvas = document.getElementById(CANVAS_ID) as HTMLCanvasElement | null;
    if (!canvas) return;
    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = "zap402-tip-qr.png";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }, []);

  return (
    <div className="flex flex-col items-center space-y-6 text-center">
      <div className="space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zap-ink-muted">
          Your tipping QR
        </p>
        <h3 className="font-body text-xl font-semibold tracking-tight text-zap-ink">
          Scan to tip
        </h3>
      </div>

      <div className="rounded-xl border border-zap-bg-alt bg-zap-surface p-4 shadow-none dark:bg-zap-bg-raised">
        <QRCodeCanvas
          id={CANVAS_ID}
          value={url}
          size={size}
          level="M"
          includeMargin={false}
          bgColor={qrBg}
          fgColor={qrFg}
        />
      </div>

      <div className="w-full space-y-3">
        <div className="flex items-center justify-center gap-2 rounded-xl border border-zap-bg-alt bg-zap-bg/25 px-3 py-2.5 dark:bg-zap-bg/10">
          <QrCode size={16} className="shrink-0 text-zap-ink-muted" aria-hidden />
          <span className="truncate font-mono text-xs font-medium text-zap-ink-muted">{url}</span>
        </div>

        <Button
          onClick={downloadQRCode}
          variant="outline"
          className="w-full"
          icon={<Download size={18} />}
        >
          Download QR (PNG)
        </Button>
      </div>
    </div>
  );
};

export default QRCode;
