import { BASE_URL } from '../api/client';

function getSessionId() {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

export function trackEvent(eventType, metadata = {}) {
  const payload = {
    eventType,
    sessionId: getSessionId(),
    metadata: {
      ...metadata,
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      referrer: document.referrer || null,
      pathname: window.location.pathname
    }
  };

  // Fire-and-forget
  fetch(`${BASE_URL}/api/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).catch(() => {
    // Silently ignore analytics failures
  });
}
