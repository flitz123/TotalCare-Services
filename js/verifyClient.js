export async function verifyIdToken(idToken) {
  const res = await fetch('/api/verifyToken', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${idToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    let body;
    try { body = await res.json(); } catch (e) { body = { error: res.statusText }; }
    throw new Error(body.error || res.statusText || 'Verification failed');
  }

  return res.json();
}
