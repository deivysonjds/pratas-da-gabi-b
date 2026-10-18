function cookieBaseOptions() {
  const production = process.env.NODE_ENV === 'production';
  const sameSite = process.env.COOKIE_SAME_SITE || (production ? 'none' : 'lax');
  return {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE
      ? process.env.COOKIE_SECURE === 'true'
      : production,
    sameSite,
    path: '/',
  };
}

function setAuthCookies(res, accessToken, refreshToken, accessExpiresIn) {
  const base = cookieBaseOptions();
  const refreshDays = Number.parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '30', 10);
  res.cookie('accessToken', accessToken, {
    ...base,
    maxAge: Math.max(1, accessExpiresIn) * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    ...base,
    maxAge: Math.max(1, refreshDays) * 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookies(res) {
  const base = cookieBaseOptions();
  res.clearCookie('accessToken', base);
  res.clearCookie('refreshToken', base);
}

module.exports = { setAuthCookies, clearAuthCookies };
