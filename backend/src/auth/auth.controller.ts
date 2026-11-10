import { Body, Controller, Delete, Get, Patch, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { IsBoolean, IsEmail, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { IntegrationsService } from './integrations.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OAuthStateService } from './oauth-state.service';
import {
  GithubCallbackGuard,
  GithubExchangeGuard,
  GithubImportCallbackGuard,
  GithubImportExchangeGuard,
  GithubImportStartGuard,
  GithubStartGuard,
  GoogleCallbackGuard,
  GoogleExchangeGuard,
  GoogleImportCallbackGuard,
  GoogleImportExchangeGuard,
  GoogleImportStartGuard,
  GoogleStartGuard,
} from './oauth-guards';
import type { OAuthImportClaim, OAuthStateClaim } from './oauth-state.service';
import type { ImportProfile } from './strategies/import.strategies';
import { err } from '../common/errors';

class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
  @IsBoolean() consent!: boolean;
  @IsOptional() @IsString() @MaxLength(80) displayName?: string;
}

class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}

class RefreshDto {
  @IsString() refreshToken!: string;
}

class UpdateMeDto {
  @IsOptional() @IsString() @MaxLength(80) displayName?: string | null;
  @IsOptional() @IsString() @MaxLength(2000) photoUrl?: string | null;
  @IsOptional() @IsObject() prefs?: Record<string, unknown>;
}

class PasswordResetRequestDto {
  @IsEmail() email!: string;
}

class PasswordResetConfirmDto {
  @IsString() token!: string;
  @IsString() @MinLength(8) @MaxLength(128) password!: string;
}

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly integrations: IntegrationsService,
    private readonly config: ConfigService,
    private readonly oauthStates: OAuthStateService,
  ) {}

  private redirectWithTokens(res: Response, tokens: { accessToken: string; refreshToken: string }) {
    const app = this.config.get<string>('PUBLIC_APP_URL') ?? 'http://localhost:5173';
    const url = new URL('/auth/callback', app);
    url.searchParams.set('accessToken', tokens.accessToken);
    url.searchParams.set('refreshToken', tokens.refreshToken);
    return res.redirect(url.toString());
  }

  private appUrl(path: string): string {
    const app = (this.config.get<string>('PUBLIC_APP_URL') ?? 'http://localhost:5173').replace(/\/+$/, '');
    return `${app}${path}`;
  }

  // Brute-force protection: auth endpoints sit on their own, much tighter
  // buckets than the general API limit (Security Plan §1).
  @Throttle({ signup: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    if (!dto.consent) return err(400, 'consent_required', 'You must accept the terms to create an account.');
    return this.auth.register(dto.email, dto.password, dto.consent, dto.displayName);
  }

  @UseGuards(AuthGuard('local'))
  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post('login')
  async login(@Req() req: { user: Parameters<AuthService['issueTokens']>[0] }) {
    return this.auth.issueTokens(req.user);
  }

  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    return this.auth.rotateRefresh(dto.refreshToken);
  }

  @Post('logout')
  async logout(@Body() dto: RefreshDto) {
    await this.auth.revokeRefresh(dto.refreshToken);
    return { ok: true };
  }

  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post('password-reset/request')
  async requestReset(@Body() dto: PasswordResetRequestDto) {
    await this.auth.requestPasswordReset(dto.email);
    return { ok: true };
  }

  @Throttle({ auth: { limit: 10, ttl: 60000 } })
  @Post('password-reset/confirm')
  async confirmReset(@Body() dto: PasswordResetConfirmDto) {
    await this.auth.confirmPasswordReset(dto.token, dto.password);
    return { ok: true };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@Req() req: { user: { userId: string } }) {
    const user = await this.auth.me(req.user.userId);
    if (!user) return err(404, 'not_found', 'User not found.');
    return { user: toMe(user) };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(@Req() req: { user: { userId: string } }, @Body() dto: UpdateMeDto) {
    const user = await this.auth.updateMe(req.user.userId, {
      displayName: dto.displayName,
      photoUrl: dto.photoUrl,
      prefs: dto.prefs,
    });
    return { user: toMe(user) };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  async deleteMe(@Req() req: { user: { userId: string } }) {
    await this.auth.deleteMe(req.user.userId);
    return { ok: true };
  }

  /** Provider tokens stored for import (existence only — tokens never leave the server). */
  @UseGuards(JwtAuthGuard)
  @Get('integrations')
  async listIntegrations(@Req() req: { user: { userId: string } }) {
    return { integrations: await this.auth.listIntegrations(req.user.userId) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('integrations/github/repos')
  async githubRepos(@Req() req: { user: { userId: string } }) {
    return { items: await this.integrations.githubRepos(req.user.userId) };
  }

  @UseGuards(JwtAuthGuard)
  @Get('integrations/google/repos')
  async googleProjects(@Req() req: { user: { userId: string } }) {
    return { items: await this.integrations.gcpProjects(req.user.userId) };
  }

  // OAuth sign-in — callback URLs point at THIS backend. `state` is issued
  // and bound to this browser on the way out, and verified before the code
  // exchange. Exchange failures redirect to sign-in (never a raw 401 page).
  @Get('google')
  @UseGuards(GoogleStartGuard)
  googleStart() {}

  @Get('google/callback')
  @UseGuards(GoogleCallbackGuard, GoogleExchangeGuard, AuthGuard('google'))
  async googleCallback(
    @Req() req: Request & {
      user: { providerId: string; email?: string; displayName?: string; photoUrl?: string };
      oauthState?: OAuthStateClaim;
    },
    @Res() res: Response,
  ) {
    const tokens = await this.auth.upsertOAuth(
      'google', req.user.providerId, req.user.email, req.user.displayName, req.user.photoUrl,
      req.oauthState?.consent === true,
    );
    return this.redirectWithTokens(res, tokens);
  }

  @Get('github')
  @UseGuards(GithubStartGuard)
  githubStart() {}

  @Get('github/callback')
  @UseGuards(GithubCallbackGuard, GithubExchangeGuard, AuthGuard('github'))
  async githubCallback(
    @Req() req: Request & {
      user: { providerId: string; email?: string; displayName?: string; photoUrl?: string };
      oauthState?: OAuthStateClaim;
    },
    @Res() res: Response,
  ) {
    const tokens = await this.auth.upsertOAuth(
      'github', req.user.providerId, req.user.email, req.user.displayName, req.user.photoUrl,
      req.oauthState?.consent === true,
    );
    return this.redirectWithTokens(res, tokens);
  }

  /** X sign-in uses OAuth 2.0 Authorization Code with PKCE (confidential web app). */
  @Get('x')
  xStart(@Req() req: Request, @Res() res: Response) {
    const clientId = this.config.get<string>('X_CLIENT_ID');
    const callbackUrl = this.config.get<string>('X_CALLBACK_URL') ?? 'http://localhost:3001/v1/auth/x/callback';
    if (!clientId || !this.config.get<string>('X_CLIENT_SECRET')) {
      return res.redirect(this.appUrl('/signin?oauth=unavailable'));
    }

    const { state, codeChallenge } = this.oauthStates.issueWithPkce(req, res, 'x');
    const authorize = new URL('https://x.com/i/oauth2/authorize');
    authorize.search = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: callbackUrl,
      scope: 'users.read users.email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    }).toString();
    return res.redirect(authorize.toString());
  }

  @Get('x/callback')
  async xCallback(@Req() req: Request, @Res() res: Response) {
    let oauthState: OAuthStateClaim;
    try {
      oauthState = this.oauthStates.verify(req, res, 'x');
    } catch {
      return res.redirect(this.appUrl('/signin?oauth=failed'));
    }

    if (firstQueryString(req.query?.['error'])) {
      return res.redirect(this.appUrl('/signin?oauth=cancelled'));
    }
    const code = firstQueryString(req.query?.['code']);
    const clientId = this.config.get<string>('X_CLIENT_ID');
    const clientSecret = this.config.get<string>('X_CLIENT_SECRET');
    const callbackUrl = this.config.get<string>('X_CALLBACK_URL') ?? 'http://localhost:3001/v1/auth/x/callback';
    if (!code || !oauthState.codeVerifier || !clientId || !clientSecret) {
      return res.redirect(this.appUrl('/signin?oauth=failed'));
    }

    try {
      const basicCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicCredentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: callbackUrl,
          code_verifier: oauthState.codeVerifier,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!tokenResponse.ok) return res.redirect(this.appUrl('/signin?oauth=failed'));
      const tokenBody = await tokenResponse.json() as { access_token?: unknown };
      if (typeof tokenBody.access_token !== 'string' || !tokenBody.access_token) {
        return res.redirect(this.appUrl('/signin?oauth=failed'));
      }

      const profileResponse = await fetch('https://api.x.com/2/users/me?user.fields=profile_image_url,confirmed_email', {
        headers: { Authorization: `Bearer ${tokenBody.access_token}` },
        signal: AbortSignal.timeout(10_000),
      });
      if (!profileResponse.ok) return res.redirect(this.appUrl('/signin?oauth=failed'));
      const profileBody = await profileResponse.json() as {
        data?: { id?: unknown; name?: unknown; username?: unknown; profile_image_url?: unknown; confirmed_email?: unknown };
      };
      const profile = profileBody.data;
      if (!profile || typeof profile.id !== 'string') return res.redirect(this.appUrl('/signin?oauth=failed'));

      const tokens = await this.auth.upsertOAuth(
        'x',
        profile.id,
        typeof profile.confirmed_email === 'string' ? profile.confirmed_email : undefined,
        typeof profile.name === 'string' ? profile.name : typeof profile.username === 'string' ? profile.username : undefined,
        typeof profile.profile_image_url === 'string' ? profile.profile_image_url : undefined,
        oauthState.consent,
      );
      return this.redirectWithTokens(res, tokens);
    } catch {
      return res.redirect(this.appUrl('/signin?oauth=failed'));
    }
  }

  // OAuth import — start guard accepts the JWT from the header or a one-time
  // ?token= query (full-page navigation carries no headers), binds userId
  // into signed state; token stored encrypted, browser returns to the picker.
  @Get('github-import')
  @UseGuards(GithubImportStartGuard)
  githubImportStart() {}

  @Get('github-import/callback')
  @UseGuards(GithubImportCallbackGuard, GithubImportExchangeGuard, AuthGuard('github-import'))
  async githubImportCallback(
    @Req() req: Request & { user: ImportProfile; importState?: OAuthImportClaim },
    @Res() res: Response,
  ) {
    await this.auth.storeIntegrationToken(req.importState!.userId, 'github', req.user.accessToken, req.user.scope);
    return res.redirect(this.appUrl('/portfolio?import=github'));
  }

  @Get('google-import')
  @UseGuards(GoogleImportStartGuard)
  googleImportStart() {}

  @Get('google-import/callback')
  @UseGuards(GoogleImportCallbackGuard, GoogleImportExchangeGuard, AuthGuard('google-import'))
  async googleImportCallback(
    @Req() req: Request & { user: ImportProfile; importState?: OAuthImportClaim },
    @Res() res: Response,
  ) {
    await this.auth.storeIntegrationToken(req.importState!.userId, 'google', req.user.accessToken, req.user.scope);
    return res.redirect(this.appUrl('/portfolio?import=google'));
  }
}

// Re-export for LoginDto use in guards if needed
export { LoginDto };

function toMe(user: {
  id: string; email?: string | null; displayName?: string | null; photoUrl?: string | null;
  passwordHash?: string | null; providerKey?: string | null; createdAt: Date;
  prefs?: Record<string, unknown> | null;
}) {
  const providers: string[] = [];
  if (user.passwordHash) providers.push('password');
  if (user.providerKey?.startsWith('google:')) providers.push('google');
  if (user.providerKey?.startsWith('github:')) providers.push('github');
  if (user.providerKey?.startsWith('x:')) providers.push('x');
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    photoUrl: user.photoUrl,
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    providers,
    prefs: user.prefs ?? null,
  };
}

function firstQueryString(value: unknown): string | null {
  if (Array.isArray(value)) value = value[0];
  return typeof value === 'string' && value.length > 0 ? value : null;
}
