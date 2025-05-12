import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import OpenAI from 'openai';
import * as sharp from 'sharp';

// Define the MulterFile interface
interface MulterFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
    destination?: string;
    filename?: string;
    path?: string;
}


@Injectable()
export class ImageService {
    private readonly openai: OpenAI;

    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }

    async processImage(file: MulterFile, prompt: string): Promise<Buffer> {
        try {
            if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
                throw new HttpException('Prompt is required and must be a non-empty string', HttpStatus.BAD_REQUEST);
            }

            // Add input validation logging
            console.log('Generating image with prompt:', prompt);
            console.log('Using model: dall-e-2');

            // Generate image from prompt only
            const response = await this.openai.images.generate({
                model: "dall-e-2",
                prompt: prompt.trim(), // Ensure prompt is trimmed
                n: 1,
                size: "1024x1024",
                response_format: "b64_json",
                // quality: "standard" // Add quality parameter
            });

            // Add response logging
            console.log('Response received:', {
                status: response.created,
                dataLength: response.data?.length
            });

            if (!response.data || response.data.length === 0) {
                throw new HttpException(
                    'No data received from AI service',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            const image_base64 = response.data[0].b64_json;
            if (!image_base64) {
                throw new HttpException(
                    'Invalid base64 data received from AI service',
                    HttpStatus.INTERNAL_SERVER_ERROR,
                );
            }
            return Buffer.from(image_base64, "base64");
        } catch (error) {
            console.error('Error generating image:', error.response?.data || error.message, error.response?.data || error);
            throw new HttpException(
                `Failed to generate image with AI service: ${error.message}`,
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }
}