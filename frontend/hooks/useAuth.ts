import { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    apiFetch('/api/v1/auth/me')
      .then(data => {
        setUser(data.user);
      })
      .catch(err => {
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { user, loading, error };
}
