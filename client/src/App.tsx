import { Route, Switch, Redirect, useLocation } from "wouter";
import { lazy, Suspense } from "react";
import { PublicLayout } from "./components/layout/PublicLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import HomePage from "./pages/public/HomePage";
import GalleryPage from "./pages/public/GalleryPage";
import AanbodPage from "./pages/public/AanbodPage";
import AboutPage from "./pages/public/AboutPage";
import ContactPage from "./pages/public/ContactPage";
import LoginPage from "./pages/admin/LoginPage";
/**
 * Beheerpagina's lui laden. Ze zijn samen goed voor het grootste deel van de bundel
 * (Recharts, date-fns, de formulierschermen) en een bezoeker van de publieke site heeft er
 * niets aan. De inlogpagina blijft direct geladen: die is klein en is het startpunt.
 */
const DashboardPage = lazy(() => import("./pages/admin/DashboardPage"));
const AgendaPage = lazy(() => import("./pages/admin/AgendaPage"));
const OmzetPage = lazy(() => import("./pages/admin/OmzetPage"));
const PackagesPage = lazy(() => import("./pages/admin/PackagesPage"));
const ReviewsPage = lazy(() => import("./pages/admin/ReviewsPage"));
const CustomerDetailPage = lazy(() => import("./pages/admin/CustomerDetailPage"));
const OrdersPage = lazy(() => import("./pages/admin/OrdersPage"));
const CustomersPage = lazy(() => import("./pages/admin/CustomersPage"));
const ProductsPage = lazy(() => import("./pages/admin/ProductsPage"));
const GalleryAdminPage = lazy(() => import("./pages/admin/GalleryAdminPage"));
const GalleryEventPage = lazy(() => import("./pages/admin/GalleryEventPage"));
const ContactRequestsPage = lazy(() => import("./pages/admin/ContactRequestsPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));

import { useAuth } from "./hooks/useAuth";
import { useLenis } from "./hooks/useLenis";
import { useScrollNaarBoven } from "./hooks/useScrollNaarBoven";
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
  return (
    <AdminLayout>
      {/* Terugval terwijl de lui geladen beheerpagina binnenkomt. */}
      <Suspense fallback={<div className="text-charcoal/40 py-20 text-center">Laden…</div>}>
        {children}
      </Suspense>
    </AdminLayout>
  );
}

export default function App() {
  const [location] = useLocation();
  // Lenis alleen op de publieke site: op de admin kaapt hij het scrollwiel, waardoor
  // geneste lijsten (zoals de aanvragenlijst) niet meer scrollen.
  useLenis(!location.startsWith("/admin"));
  // Nieuwe pagina = bovenaan beginnen. Geldt voor de publieke site en het beheerpaneel.
  useScrollNaarBoven();

  return (
    <Switch>
      <Route path="/admin/login" component={LoginPage} />
      <Route path="/admin">
        <ProtectedAdmin><DashboardPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/agenda">
        <ProtectedAdmin><AgendaPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/omzet">
        <ProtectedAdmin><OmzetPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/pakketten">
        <ProtectedAdmin><PackagesPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/reviews">
        <ProtectedAdmin><ReviewsPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/boekingen">
        <ProtectedAdmin><OrdersPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/klanten/:id">
        <ProtectedAdmin><CustomerDetailPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/klanten">
        <ProtectedAdmin><CustomersPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/producten">
        <ProtectedAdmin><ProductsPage /></ProtectedAdmin>
      </Route>
      <Route path="/admin/galerij/:id">
        <ProtectedAdmin><GalleryEventPage /></ProtectedAdmin>
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
              <Route path="/galerij/:slug/:albumSlug" component={GalleryPage} />
              <Route path="/galerij/:slug" component={GalleryPage} />
              <Route path="/aanbod" component={AanbodPage} />
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
