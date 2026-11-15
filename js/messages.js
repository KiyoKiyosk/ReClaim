export function friendlyError(err) {
  const map = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'Incorrect email or password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists. Try logging in instead.',
    'auth/weak-password': 'Your password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a few minutes and try again.',
    'auth/network-request-failed': 'Network problem. Check your internet connection and try again.',
    'permission-denied': 'You do not have permission to do that.',
    'unavailable': 'The service is unavailable right now. Please try again.',
    'resource-exhausted': 'The service is busy right now. Please try again later.',
    'photo-unreadable': 'That image could not be read. Try a JPG or PNG file.'
  };
  return map[err && err.code] || 'Something went wrong. Please try again.';
}