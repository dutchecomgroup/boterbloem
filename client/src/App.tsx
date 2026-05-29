import { Route, Switch, Redirect } from "wouter";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import HomePage from "./pages/public/HomePage";
import GalleryPage from "./pages/public/GalleryPage";
import ServicesPage from "./pages/public/ServicesPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import LoginPage from "./pages/admin/LoginPage";
import DashboardPage from "./pages/admin/DashboardPage";
import OrdersPage from "./pages/admin/OrdersPage";
import CustomersPage from "./pages/admin/CustomersPage";
import ProductsPage from "./pages/admin/ProductsPage";
import GalleryAdminPage from "./pages/admin/GalleryAdminPage";
import ContactRequestsPage from "./pages/admin/ContactRequestsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import { useAuth } from "./hooks/useAuth";
import { useLenis } from "./hooks/useLenis";
import { PageTransition } from "./components/PageTransition";

function ProtectedAdmin({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-charcoal/40">
        Laden…
      </div>
    );
  }
  if (!user) return <Redirect to="/admin/login" />;
  return <AdminLayout>{children}</AdminLayout>;
}

export default function App() {
  useLenis();
  return (
    <Switch>
      <Route path="/admin/login" component={LoginPage} />
      <Route path="/admin">
        <ProtectedAdmin><DashboardPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/boekingen">
        <ProtectedAdmin><OrdersPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/klanten">
        <ProtectedAdmin><CustomersPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/producten">
        <ProtectedAdmin><ProductsPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/galerij">
        <ProtectedAdmin><GalleryAdminPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/aanvragen">
        <ProtectedAdmin><ContactRequestsPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/instellingen">
        <ProtectedAdmin><SettingsPage /></ProtectedAdmin>
      </Route>

      <Route>
        <PublicLayout>
          <PageTransition>
            <Switch>
              <Route path="/" component={HomePage} />
              <Route path="/galerij" component={GalleryPage} />
              <Route path="/galerij/:slug" component={GalleryPage} />
              <Route path="/diensten" component={ServicesPage} />
              <Route path="/over" component={AboutPage} />
              <Route path="/contact" component={ContactPage} />
              <Route>
                <div className="container-tight py-32 text-center">
                  <h1 className="text-4xl mb-4">Pagina niet gevonden</h1>
                  <a href="/" className="text-gold underline">Terug naar home</a>
                </div>
              </Route>
            </Switch>
          </PageTransition>
        </PublicLayout>
      </Route>
    </Switch>
  );
}
