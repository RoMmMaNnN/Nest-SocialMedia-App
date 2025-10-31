import { Body, Controller, Post, UseGuards, Req } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RefreshTokenGuard } from '../../../common/guards/refresh-token.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  async refresh(@Req() req) {
    return this.authService.rotateRefreshToken(
      req.user,
      req.headers['user-agent'],
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req) {
    return this.authService.logout(req.user.sub);
  }
}
