import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { queryClient } from '@/lib/query-client';
import { CartProvider } from '@/hooks/useCart';
import { AppLayout } from '@/components/AppLayout';
import { BrowsePage } from '@/pages/BrowsePage';
import { ProductPage } from '@/pages/ProductPage';
import { CartPage } from '@/pages/CartPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { SellPage } from '@/pages/SellPage';
import { VendorRegisterPage } from '@/pages/VendorRegisterPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      // MVP 1 — browse and order
      { index: true, element: <BrowsePage /> },
      { path: 'products/:id', element: <ProductPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'orders', element: <OrdersPage /> },

      // MVP 2 — register as a vendor and sell
      { path: 'sell', element: <SellPage /> },
      { path: 'sell/register', element: <VendorRegisterPage /> },

      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <RouterProvider router={router} />
      </CartProvider>
    </QueryClientProvider>
  );
}
