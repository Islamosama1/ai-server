import { Controller, Post, UseInterceptors, UploadedFile, Body, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ImageService } from './image.service';
import { ProcessImageDto } from './dto/process-image.dto';

@Controller('image')
export class ImageController {
    constructor(private readonly imageService: ImageService) { }

    @Post('process')
    @UseInterceptors(FileInterceptor('image'))
    async processImage(
        @UploadedFile() file: Express.Multer.File,
        @Body() processImageDto: ProcessImageDto,
        @Res() res: Response,
    ) {
        if (!processImageDto.prompt) {
            if (!file) {
                return res.status(400).json({ message: 'Image file is required if no prompt is provided' });
            }
            return res.status(400).json({ message: 'Prompt is required' });
        }

        try {
            const processedImageBuffer = await this.imageService.processImage(
                file, // This can be null/undefined
                processImageDto.prompt,
            );

            res.set({
                'Content-Type': 'image/png', // DALL-E typically returns PNG
                'Content-Disposition': 'inline',
            });

            return res.send(processedImageBuffer);
        } catch (error) {
            console.error('Controller error:', error);
            return res.status(error.status || 500).json({
                message: error.message,
                details: error.response?.data || error.error
            });
        }
    }
}