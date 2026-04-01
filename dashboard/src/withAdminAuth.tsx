import { useAuth } from '../src/auth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function withAdminAuth(Component: any) {
  return function ProtectedComponent(props: any) {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!user) {
        router.replace('/login');
      }
    }, [user, router]);

    if (!user) return null;
    return <Component {...props} />;
  };
}
