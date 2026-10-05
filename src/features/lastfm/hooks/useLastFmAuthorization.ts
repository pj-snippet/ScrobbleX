import { useState } from 'react';
import {
  completeLastFmAuthorization,
  disconnectLastFm,
  requestLastFmAuthorization,
  type LastFmConnection,
} from '../api/lastfmApi';

export function useLastFmAuthorization(
  onConnected: (connection: LastFmConnection) => void,
  onDisconnected: () => void
) {
  const [authToken, setAuthToken] = useState<string | null>(() =>
    localStorage.getItem('scrobblex_lastfm_pending_token')
  );
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const startAuthorization = async () => {
    setIsAuthBusy(true);
    setAuthError(null);
    try {
      const authorization = await requestLastFmAuthorization();
      localStorage.setItem('scrobblex_lastfm_pending_token', authorization.token);
      setAuthToken(authorization.token);
      setIsAuthBusy(false);
      window.location.assign(authorization.authorizationUrl);
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Could not start Last.fm authorization.'
      );
      setIsAuthBusy(false);
    }
  };

  const completeAuthorization = async () => {
    if (!authToken) return;
    setIsAuthBusy(true);
    setAuthError(null);
    try {
      const session = await completeLastFmAuthorization(authToken);
      localStorage.removeItem('scrobblex_lastfm_pending_token');
      setAuthToken(null);
      onConnected(session);
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Could not complete Last.fm sign-in.'
      );
    } finally {
      setIsAuthBusy(false);
    }
  };

  const disconnect = async () => {
    setIsAuthBusy(true);
    setAuthError(null);
    try {
      await disconnectLastFm();
      localStorage.removeItem('scrobblex_lastfm_username');
      localStorage.removeItem('scrobblex_lastfm_pending_token');
      setAuthToken(null);
      onDisconnected();
    } catch (error) {
      setAuthError(
        error instanceof Error ? error.message : 'Could not disconnect Last.fm.'
      );
    } finally {
      setIsAuthBusy(false);
    }
  };

  return {
    authToken,
    isAuthBusy,
    authError,
    startAuthorization,
    completeAuthorization,
    disconnect,
  };
}
