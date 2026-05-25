import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(64)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string;
}
