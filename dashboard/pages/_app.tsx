import type { AppProps } from 'next/app';
import { CssBaseline } from '@mui/material';
import { AuthProvider } from '../src/auth';
import { NotificationProvider } from '../src/notification';

  return (
    <NotificationProvider>
      <AuthProvider>
        <CssBaseline />
        <Component {...pageProps} />
      </AuthProvider>
    </NotificationProvider>
  );
}
