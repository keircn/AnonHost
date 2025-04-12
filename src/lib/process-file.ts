import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import sharp from 'sharp';
import type { FileSettings } from '@/types/file-settings';

let ffmpeg: FFmpeg | null = null;

async function initFFmpeg() {
    if (ffmpeg) return ffmpeg;

    ffmpeg = new FFmpeg();

    await ffmpeg.load({
        coreURL: await toBlobURL(`/ffmpeg/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`/ffmpeg/ffmpeg-core.wasm`, 'application/wasm'),
    });

    return ffmpeg;
}

export async function processFile(
    file: Blob,
    settings: FileSettings
): Promise<Blob> {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = file.type;
    const fileName = (file as any).name || 'file';

    if (
        !settings.compression.enabled &&
        !settings.conversion.enabled &&
        !settings.resize.enabled
    ) {
        return file;
    }

    if (fileType.startsWith('image/')) {
        let image = sharp(buffer);

        if (settings.resize.enabled) {
            image = image.resize({
                width: settings.resize.width,
                height: settings.resize.height,
                fit: settings.resize.maintainAspectRatio ? 'inside' : 'fill',
            });
        }

        let format: keyof sharp.FormatEnum | undefined;
        let formatOptions: any = {};

        if (settings.conversion.enabled && settings.conversion.format) {
            format = settings.conversion.format as keyof sharp.FormatEnum;
            if (settings.compression.enabled) {
                switch (format) {
                    case 'jpeg':
                    case 'jpg':
                        formatOptions = {
                            quality: settings.compression.quality,
                            mozjpeg: true
                        };
                        break;
                    case 'webp':
                        formatOptions = {
                            quality: settings.compression.quality,
                            lossless: false
                        };
                        break;
                    case 'gif':
                        formatOptions = {
                            colours: Math.max(2, Math.min(256, Math.round(256 * (settings.compression.quality / 100))))
                        };
                        break;
                }
            }
        } else if (settings.compression.enabled) {
            format = (fileType.split('/')[1] as keyof sharp.FormatEnum) || 'jpeg';
            formatOptions = {
                quality: settings.compression.quality,
                mozjpeg: format === 'jpeg' || format === 'jpg'
            };
        }

        if (format) {
            image = image.toFormat(format, formatOptions);
        }

        const processedBuffer = await image.toBuffer();
        return new Blob([processedBuffer], {
            type: settings.conversion.enabled && settings.conversion.format
                ? `image/${settings.conversion.format}`
                : fileType
        });
    }

    if (fileType.startsWith('video/')) {
        const ffmpeg = await initFFmpeg();
        const extension = fileName.split('.').pop() || 'mp4';
        const inputFileName = `input.${extension}`;
        const outputFormat = settings.conversion.enabled && settings.conversion.format
            ? settings.conversion.format
            : extension;
        const outputFileName = `output.${outputFormat}`;

        ffmpeg.writeFile(inputFileName, await fetchFile(file));

        const args = ['-i', inputFileName];

        if (settings.compression.enabled) {
            args.push('-crf', `${Math.round((100 - settings.compression.quality) / 2)}`);
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
        return new Blob([data], {
            type: `video/${outputFormat}`
        });
    }

    return file;
}