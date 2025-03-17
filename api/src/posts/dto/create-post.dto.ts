import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsNotEmpty } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({ example: 'https://example.com/resource.jpg', description: 'Resource URL' })
  @IsUrl()
  @IsNotEmpty()
  resourceUrl: string;
} 