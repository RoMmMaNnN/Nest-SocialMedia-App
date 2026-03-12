import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { User } from '../../users/entities/user.entity';

type AuthResponse = { user: User; access_token: string; refresh_token: string };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Register a new user (sends verification email)' })
  @ApiResponse({ status: 201, description: 'Registration successful, email sent.' })
  @ApiResponse({ status: 403, description: 'Email or username already in use.' })
  @ApiBody({ type: RegisterDto })
  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Verify email with token from email link' })
  @ApiResponse({ status: 200, description: 'Email verified.' })
  @ApiResponse({ status: 404, description: 'Invalid or expired token.' })
  @ApiBody({ type: VerifyEmailDto })
  @Public()
  @Post('verify-email')
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ message: string }> {
    return this.authService.verifyEmail(dto.token);
  }

  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  @ApiResponse({ status: 403, description: 'Email not verified.' })
  @ApiBody({ type: LoginDto })
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  @Public()
  @Post('login')
  login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token in body' })
  @ApiResponse({ status: 200, description: 'Tokens rotated.' })
  @ApiBody({ type: RefreshTokenDto })
  @Public()
  @Post('refresh')
  refresh(
    @Body() dto: RefreshTokenDto,
  ): Promise<{ access_token: string; refresh_token: string }> {
    return this.authService.rotateRefreshToken(dto);
  }

  @ApiOperation({ summary: 'Get current authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Current user returned.' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@CurrentUser() user: User): User {
    return user;
  }

  @ApiOperation({ summary: 'Logout and revoke refresh tokens' })
  @ApiResponse({ status: 200, description: 'Logged out.' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@CurrentUser() user: { id: number }): Promise<{ message: string }> {
    return this.authService.logout(user.id);
  }
}
