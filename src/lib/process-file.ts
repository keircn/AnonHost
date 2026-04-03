import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import sharp from "sharp";
import type { FileSettings } from "@/types/file-settings";

let ffmpeg: FFmpeg | null = null;

function toSafeBlobPart(data: unknown): BlobPart {
  if (typeof data === "string") {
    return data;
  }

  if (data instanceof Uint8Array || Buffer.isBuffer(data)) {
    const bytes = Uint8Array.from(data);
    return bytes.buffer;
  }

  throw new Error("Unsupported processed file data type");
}

async function initFFmpeg() {
  if (ffmpeg) return ffmpeg;

  ffmpeg = new FFmpeg();

  await ffmpeg.load({
    coreURL: await toBlobURL(`/ffmpeg/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`/ffmpeg/ffmpeg-core.wasm`, "application/wasm"),
  });

  return ffmpeg;
}

export async function processFile(file: Blob, settings: FileSettings): Promise<Blob> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const fileType = file.type;
  const fileName = (file as File).name || "file";

  if (
    !settings.stripMetadata &&
    !settings.optimizeForWeb &&
    !settings.compression.enabled &&
    !settings.conversion.enabled &&
    !settings.resize.enabled
  ) {
    return file;
  }

  if (fileType.startsWith("image/")) {
    let image = sharp(buffer, {
      failOnError: false,
      limitInputPixels: false,
    });

    if (settings.stripMetadata) {
      image = image.withMetadata({
        orientation: 1,
      });
    }

    if (settings.optimizeForWeb) {
      image = image.rotate().pipelineColorspace("srgb");
    }

    if (settings.resize.enabled) {
      image = image.resize({
        width: settings.resize.width,
        height: settings.resize.height,
        fit: settings.resize.maintainAspectRatio ? (settings.resize.fit ?? "inside") : "fill",
      });
    }

    const currentFormat = fileType.split("/")[1] as keyof sharp.FormatEnum;

    let format = currentFormat;
    let formatOptions: Record<string, unknown> = {};

    if (settings.conversion.enabled && settings.conversion.format) {
      format = settings.conversion.format as keyof sharp.FormatEnum;
    }

    if (settings.compression.enabled) {
      switch (format) {
        case "jpeg":
        case "jpg":
          formatOptions = {
            quality: settings.compression.quality,
            mozjpeg: true,
            chromaSubsampling: "4:4:4",
            progressive: settings.optimizeForWeb,
          };
          break;
        case "webp":
          formatOptions = {
            quality: settings.compression.quality,
            lossless: false,
            effort: 6,
            smartSubsample: settings.optimizeForWeb,
          };
          break;
        case "png":
          formatOptions = {
            compressionLevel: Math.min(
              9,
              Math.max(0, Math.round((100 - settings.compression.quality) / 11)),
            ),
            palette: true,
            progressive: settings.optimizeForWeb,
          };
          break;
        case "gif":
          formatOptions = {
            colours: Math.max(
              2,
              Math.min(256, Math.round(256 * (settings.compression.quality / 100))),
            ),
          };
          break;
      }
    }

    image = image.toFormat(format, formatOptions);

    const processedBuffer = await image.toBuffer();
    return new Blob([toSafeBlobPart(processedBuffer)], {
      type:
        settings.conversion.enabled && settings.conversion.format
          ? `image/${settings.conversion.format}`
          : fileType,
    });
  }

  if (fileType.startsWith("video/")) {
    const ffmpeg = await initFFmpeg();
    const extension = fileName.split(".").pop() || "mp4";
    const inputFileName = `input.${extension}`;
    const outputFormat =
      settings.conversion.enabled && settings.conversion.format
        ? settings.conversion.format
        : extension;
    const outputFileName = `output.${outputFormat}`;

    ffmpeg.writeFile(inputFileName, await fetchFile(file));

    const args = ["-i", inputFileName];

    if (settings.compression.enabled || settings.optimizeForWeb) {
      const quality = settings.compression.enabled ? settings.compression.quality : 80;
      args.push("-crf", `${Math.round((100 - quality) / 2)}`);
    }

    if (settings.resize.enabled) {
      const scale = settings.resize.maintainAspectRatio
        ? `scale='min(${settings.resize.width || -1}\\,iw):min(${settings.resize.height || -1}\\,ih):force_original_aspect_ratio=decrease'`
        : `scale=${settings.resize.width || -1}:${settings.resize.height || -1}`;
      args.push("-vf", scale);
    }

    if (settings.conversion.enabled && settings.conversion.format) {
      switch (settings.conversion.format) {
        case "webm":
          args.push("-c:v", "libvpx-vp9", "-c:a", "libopus");
          break;
        case "mp4":
          args.push("-c:v", "libx264", "-c:a", "aac");
          break;
      }
    }

    if (settings.optimizeForWeb) {
      args.push("-movflags", "+faststart");
    }

    args.push(outputFileName);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputFileName);
    return new Blob([toSafeBlobPart(data)], {
      type: `video/${outputFormat}`,
    });
  }

  return file;
}
