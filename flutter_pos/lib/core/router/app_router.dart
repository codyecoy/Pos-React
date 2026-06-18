import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_pos/features/auth/presentation/pages/login_page.dart';
import 'package:flutter_pos/features/cashier/presentation/pages/cashier_page.dart';
import 'package:flutter_pos/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:flutter_pos/features/products/presentation/pages/products_page.dart';
import 'package:flutter_pos/features/customers/presentation/pages/customers_page.dart';
import 'package:flutter_pos/features/reports/presentation/pages/reports_page.dart';
import 'package:flutter_pos/features/settings/presentation/pages/settings_page.dart';
import 'package:flutter_pos/features/suppliers/presentation/pages/suppliers_page.dart';
import 'package:flutter_pos/features/purchasing/presentation/pages/purchasing_page.dart';
import 'package:flutter_pos/features/debts/presentation/pages/debts_page.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return ScaffoldWithNavBar(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/cashier',
                name: 'cashier',
                builder: (context, state) => const CashierPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/dashboard',
                name: 'dashboard',
                builder: (context, state) => const DashboardPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/products',
                name: 'products',
                builder: (context, state) => const ProductsPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/customers',
                name: 'customers',
                builder: (context, state) => const CustomersPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/reports',
                name: 'reports',
                builder: (context, state) => const ReportsPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/suppliers',
                name: 'suppliers',
                builder: (context, state) => const SuppliersPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/purchasing',
                name: 'purchasing',
                builder: (context, state) => const PurchasingPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/debts',
                name: 'debts',
                builder: (context, state) => const DebtsPage(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: '/settings',
                name: 'settings',
                builder: (context, state) => const SettingsPage(),
              ),
            ],
          ),
        ],
      ),
    ],
  );
});

class ScaffoldWithNavBar extends StatelessWidget {
  const ScaffoldWithNavBar({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) {
          navigationShell.goBranch(index);
        },
        destinations: const [
          NavigationDestination(icon: Icon(Icons.point_of_sale), label: 'POS'),
          NavigationDestination(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          NavigationDestination(icon: Icon(Icons.inventory), label: 'Produk'),
          NavigationDestination(icon: Icon(Icons.people), label: 'Pelanggan'),
          NavigationDestination(icon: Icon(Icons.bar_chart), label: 'Laporan'),
          NavigationDestination(icon: Icon(Icons.store), label: 'Supplier'),
          NavigationDestination(icon: Icon(Icons.shopping_cart), label: 'Pembelian'),
          NavigationDestination(icon: Icon(Icons.payment), label: 'Hutang'),
          NavigationDestination(icon: Icon(Icons.settings), label: 'Pengaturan'),
        ],
      ),
    );
  }
}
