import { useEffect, useRef, useState } from 'react';
import { Download, ImagePlus, Loader2, ShieldCheck, X } from 'lucide-react';

interface StoryHdToolProps {
  onBack: () => void;
  onClose: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function StoryHdTool({ onBack, onClose }: StoryHdToolProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState('');
  const [quality, setQuality] = useState(0.88);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ url: string; name: string; size: number; type: 'image' | 'video' } | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
    if (result) URL.revokeObjectURL(result.url);
  }, [preview, result]);

  const chooseFile = (next?: File) => {
    if (!next) return;
    setError('');
    setResult(null);
    if (!next.type.startsWith('image/') && !next.type.startsWith('video/')) {
      setFile(null);
      setPreview('');
      setError('Format file ini tidak didukung. Pilih foto atau video.');
      return;
    }
    if (next.size > 100 * 1024 * 1024) {
      setError('Ukuran maksimum file adalah 100 MB.');
      return;
    }
    setFile(next);
    setPreview(URL.createObjectURL(next));
  };

  const processPhoto = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      try {
        // WhatsApp Status portrait canvas target; preserve image aspect ratio and never upscale.
        const maxW = 1080;
        const maxH = 1920;
        const scale = Math.min(1, maxW / bitmap.width, maxH / bitmap.height);
        const width = Math.max(1, Math.round(bitmap.width * scale));
        const height = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Browser tidak menyediakan Canvas untuk memproses foto.');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(bitmap, 0, 0, width, height);
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((value) => value ? resolve(value) : reject(new Error('Ekspor foto gagal.')), 'image/jpeg', quality);
        });
        const url = URL.createObjectURL(blob);
        setResult({ url, size: blob.size, name: `${file.name.replace(/\.[^.]+$/, '')}-story-hd.jpg`, type: 'image' });
      } finally {
        bitmap.close();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Foto tidak dapat diproses di browser ini.');
    } finally {
      setBusy(false);
    }
  };

  const processVideo = async () => {
    if (!file) return;
    if (typeof MediaRecorder === 'undefined' || !HTMLCanvasElement.prototype.captureStream) {
      setError('Browser ini tidak mendukung pemrosesan video lokal. Coba Chrome atau Edge versi terbaru.');
      return;
    }
    setBusy(true);
    setError('');
    let inputUrl = '';
    let frameId = 0;
    let recorder: MediaRecorder | null = null;
    let combinedStream: MediaStream | null = null;
    try {
      const video = document.createElement('video');
      video.muted = false;
      video.playsInline = true;
      video.preload = 'auto';
      inputUrl = URL.createObjectURL(file);
      video.src = inputUrl;
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Browser tidak dapat membaca codec video ini.'));
      });
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) throw new Error('Resolusi video tidak terbaca.');
      const scale = Math.min(1, 1080 / vw, 1920 / vh);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(2, Math.round(vw * scale / 2) * 2);
      canvas.height = Math.max(2, Math.round(vh * scale / 2) * 2);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Browser tidak menyediakan Canvas untuk video.');
      const canvasStream = canvas.captureStream(30);
      const videoCapture = (video as HTMLVideoElement & { captureStream?: () => MediaStream; mozCaptureStream?: () => MediaStream });
      const sourceStream = videoCapture.captureStream?.() || videoCapture.mozCaptureStream?.();
      const audioTracks = sourceStream?.getAudioTracks() || [];
      combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
      const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
        .find((type) => MediaRecorder.isTypeSupported(type));
      if (!mime) throw new Error('Browser tidak menyediakan encoder WebM yang didukung.');
      recorder = new MediaRecorder(combinedStream, { mimeType: mime, videoBitsPerSecond: 2_500_000 });
      const chunks: BlobPart[] = [];
      const finished = new Promise<Blob>((resolve, reject) => {
        recorder!.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
        recorder!.onerror = () => reject(new Error('Perekaman video gagal.'));
        recorder!.onstop = () => chunks.length ? resolve(new Blob(chunks, { type: mime })) : reject(new Error('Browser menghasilkan video kosong.'));
      });
      const drawFrame = () => {
        if (video.readyState >= 2) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (!video.ended && !video.paused) frameId = requestAnimationFrame(drawFrame);
      };
      video.onended = () => { if (recorder?.state === 'recording') recorder.stop(); };
      recorder.start(250);
      frameId = requestAnimationFrame(drawFrame);
      await video.play();
      const blob = await finished;
      const url = URL.createObjectURL(blob);
      setResult({ url, size: blob.size, name: `${file.name.replace(/\.[^.]+$/, '')}-story-hd.webm`, type: 'video' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Video tidak dapat diproses di browser ini.');
    } finally {
      if (frameId) cancelAnimationFrame(frameId);
      if (recorder?.state === 'recording') recorder.stop();
      combinedStream?.getTracks().forEach((track) => track.stop());
      if (inputUrl) URL.revokeObjectURL(inputUrl);
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 px-4 py-3 sm:px-6">
        <button type="button" onClick={onBack} className="rounded-xl border border-white/15 px-3 py-2 text-xs text-slate-200 hover:bg-white/10">← Kembali ke tools</button>
        <button type="button" onClick={onClose} aria-label="Tutup" className="rounded-xl p-2 text-slate-300 hover:bg-white/10"><X className="h-5 w-5" /></button>
      </div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
        <div>
          <h2 className="text-xl font-bold text-white">Story HD</h2>
          <p className="mt-1 text-sm text-slate-300">Siapkan foto atau video untuk Status WhatsApp. File diproses di browser dan tidak diunggah.</p>
        </div>
        <div className="flex items-start gap-2 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-xs leading-relaxed text-emerald-100"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />Privat: pemrosesan berlangsung lokal. Hasil adalah resize dan kompresi JPEG, bukan AI enhancement.</div>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif,video/*" className="hidden" onChange={(e) => chooseFile(e.target.files?.[0])} />
        <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-36 w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-cyan-300/35 bg-white/[0.03] p-5 text-sm text-slate-200 hover:bg-white/[0.07]">
          {preview ? file?.type.startsWith('video/') ? <video src={preview} controls playsInline className="max-h-56 max-w-full rounded-xl" /> : <img src={preview} alt="Pratinjau foto yang dipilih" className="max-h-56 max-w-full rounded-xl object-contain" /> : <><ImagePlus className="h-8 w-8 text-cyan-300" /><span>Pilih foto atau video · maks. 100 MB</span></>}
        </button>
        {file && <p className="text-xs text-slate-400">{file.name} · {formatBytes(file.size)}</p>}
        {file?.type.startsWith('video/') ? <p className="rounded-xl border border-amber-300/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-amber-100">Video akan diekspor sebagai WebM pada resolusi maksimal 1080×1920. Dukungan codec dan audio bergantung pada browser; video ini belum diuji untuk semua perangkat WhatsApp.</p> : <label className="block text-sm text-slate-200">Kualitas JPEG <span className="text-cyan-200">{Math.round(quality * 100)}%</span>
          <input aria-label="Kualitas JPEG" type="range" min="60" max="95" value={Math.round(quality * 100)} onChange={(e) => setQuality(Number(e.target.value) / 100)} className="mt-2 w-full accent-cyan-400" />
        </label>}
        {error && <p role="alert" className="rounded-xl border border-red-400/25 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
        {result && <div className="rounded-xl border border-cyan-300/20 bg-cyan-500/5 p-3 text-sm text-slate-200">Hasil siap · {formatBytes(result.size)} · {result.type === 'video' ? 'WebM' : 'JPEG'}
          <a href={result.url} download={result.name} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 font-semibold text-white hover:bg-cyan-600"><Download className="h-4 w-4" />Unduh {result.type === 'video' ? 'video' : 'foto'}</a>
        </div>}
      </div>
      <div className="border-t border-white/10 px-4 py-3 sm:px-6"><button type="button" disabled={!file || busy} onClick={file?.type.startsWith('video/') ? processVideo : processPhoto} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-700 px-4 text-sm font-bold text-white disabled:opacity-40">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{busy ? 'Memproses di perangkat…' : file?.type.startsWith('video/') ? 'Optimalkan Video' : 'Optimalkan Foto'}</button></div>
    </>
  );
}
