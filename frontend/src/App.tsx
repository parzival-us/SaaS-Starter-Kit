import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { router } from '@/routes';

function AppContent() {
  const { isDark } = useTheme();

  return (
    <>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <Toaster
        position="top-right"
        richColors
        theme={isDark ? 'dark' : 'light'}
        toastOptions={{
          style: {
            borderRadius: '12px',
          },
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
