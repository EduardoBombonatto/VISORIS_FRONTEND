export const SESSION_COOKIE_NAME = 'visoris_session';

export function setSessionCookie() {
  document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; SameSite=Strict`;
}

export function clearSessionCookie() {
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`;
}
