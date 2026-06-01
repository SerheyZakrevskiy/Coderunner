import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateRunDto {
  @ApiProperty({
    example: 'python',
    enum: ['python', 'javascript'],
  })
  @IsString()
  @IsIn(['python', 'javascript'])
  language!: string;

  @ApiProperty({
    example: 'print(123)',
    maxLength: 10000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  code!: string;
}
