import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import sharp from 'sharp';
import type { FileSettings } from '@/types/file-settings';

let ffmpeg: FFmpeg | null = null;
let isInitializing = false;

async function initFFmpeg() {
  if (ffmpeg) return ffmpeg;
  
  // Prevent multiple simultaneous initialization attempts
  if (isInitializing) {
    // Wait for existing initialization to complete
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (ffmpeg) return ffmpeg;
  }

  isInitializing = true;
  
  try {
    ffmpeg = new FFmpeg();

    await ffmpeg.load({
      coreURL: await toBlobURL(`/ffmpeg/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`/ffmpeg/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpeg;
  } finally {
    isInitializing = false;
  }
}

export async function processFile(
  file: Blob,
  settings: FileSettings
): Promise<Blob> {
  // Early return if no processing is needed
  if (
    !settings.compression.enabled &&
    !settings.conversion.enabled &&
    !settings.resize.enabled
  ) {
    return file;
  }

  const fileType = file.type;
  const fileName = (file as File).name || 'file';

  if (fileType.startsWith('image/')) {
    // Process images using Sharp with streaming to reduce memory usage
    const buffer = Buffer.from(await file.arrayBuffer());
    let image = sharp(buffer);

    if (settings.resize.enabled) {
      image = image.resize({
        width: settings.resize.width,
        height: settings.resize.height,
        fit: settings.resize.maintainAspectRatio ? 'inside' : 'fill',
      });
    }

    const currentFormat = fileType.split('/')[1] as keyof sharp.FormatEnum;

    let format = currentFormat;
    let formatOptions: Record<string, unknown> = {};

    if (settings.conversion.enabled && settings.conversion.format) {
      format = settings.conversion.format as keyof sharp.FormatEnum;
    }

    if (settings.compression.enabled) {
      switch (format) {
        case 'jpeg':
        case 'jpg':
          formatOptions = {
            quality: settings.compression.quality,
            mozjpeg: true,
            chromaSubsampling: '4:4:4',
          };
          break;
        case 'webp':
          formatOptions = {
            quality: settings.compression.quality,
            lossless: false,
            effort: 6,
          };
          break;
        case 'png':
          formatOptions = {
            compressionLevel: Math.min(
              9,
              Math.max(0, Math.round((100 - settings.compression.quality) / 11))
            ),
            palette: true,
          };
          break;
        case 'gif':
          formatOptions = {
            colours: Math.max(
              2,
              Math.min(
                256,
                Math.round(256 * (settings.compression.quality / 100))
              )
            ),
          };
          break;
      }
    }

    image = image.toFormat(format, formatOptions);

    const processedBuffer = await image.toBuffer();
    return new Blob([processedBuffer], {
      type:
        settings.conversion.enabled && settings.conversion.format
          ? `image/${settings.conversion.format}`
          : fileType,
    });
  }

  if (fileType.startsWith('video/')) {
    const ffmpeg = await initFFmpeg();
    const extension = fileName.split('.').pop() || 'mp4';
    const inputFileName = `input.${extension}`;
    const outputFormat =
      settings.conversion.enabled && settings.conversion.format
        ? settings.conversion.format
        : extension;
    const outputFileName = `output.${outputFormat}`;

    // Use fetchFile directly to avoid additional buffer conversion
    await ffmpeg.writeFile(inputFileName, await fetchFile(file));

    const args = ['-i', inputFileName];

    if (settings.compression.enabled) {
      args.push(
        '-crf',
        `${Math.round((100 - settings.compression.quality) / 2)}`
      );
    }

    if (settings.resize.enabled) {
      const scale = settings.resize.maintainAspectRatio
        ? `scale='min(${settings.resize.width || -1}\\,iw):min(${settings.resize.height || -1}\\,ih):force_original_aspect_ratio=decrease'`
        : `scale=${settings.resize.width || -1}:${settings.resize.height || -1}`;
      args.push('-vf', scale);
    }

    if (settings.conversion.enabled && settings.conversion.format) {
      switch (settings.conversion.format) {
        case 'webm':
          args.push('-c:v', 'libvpx-vp9', '-c:a', 'libopus');
          break;
        case 'mp4':
          args.push('-c:v', 'libx264', '-c:a', 'aac');
          break;
      }
    }

    args.push(outputFileName);

    await ffmpeg.exec(args);

    const data = await ffmpeg.readFile(outputFileName);
    
    // Clean up temporary files to free memory
    try {
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);
    } catch (error) {
      console.warn('Failed to clean up temporary files:', error);
    }

    return new Blob([data], {
      type: `video/${outputFormat}`,
    });
  }

  return file;
}
