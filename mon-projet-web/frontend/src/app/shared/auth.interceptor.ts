import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthTokenService } from './auth-token.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authToken = inject(AuthTokenService);
  const token = authToken.getToken();
  const isLogin = req.url.includes('/api/auth/login');
  if (token && !isLogin) {
    return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
  }
  return next(req);
};
