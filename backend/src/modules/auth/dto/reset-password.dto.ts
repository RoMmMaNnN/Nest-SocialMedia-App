import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'f7cc4d85-7eda-4909-8718-68e100f47fdf' })
  @IsString()
  token: string;

  @ApiProperty({ example: 'newStrongPassword123', minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;

  @ApiProperty({ example: 'newStrongPassword123' })
  @IsString()
  confirmPassword: string;
}
