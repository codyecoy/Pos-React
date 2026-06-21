import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_pos/core/utils/responsive_layout.dart';
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
import 'package:flutter_pos/features/auth/presentation/providers/auth_provider.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final authState = ref.read(authStateProvider);
      final isLoggedIn = authState.valueOrNull?.user != null;
      final isGoingToLogin = state.matchedLocation == '/login';

      if (!isLoggedIn && !isGoingToLogin) {
        return '/login';
      }
      if (isLoggedIn && isGoingToLogin) {
        return '/cashier';
      }
      return null;
    },
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

class ScaffoldWithNavBar extends StatefulWidget {
  const ScaffoldWithNavBar({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  State<ScaffoldWithNavBar> createState() => _ScaffoldWithNavBarState();
}

class _ScaffoldWithNavBarState extends State<ScaffoldWithNavBar> {
  bool _isMenuOpen = false;

  void _toggleMenu() {
    setState(() {
      _isMenuOpen = !_isMenuOpen;
    });
  }

  void _closeMenu() {
    if (_isMenuOpen) {
      setState(() {
        _isMenuOpen = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = ResponsiveLayout.isMobile(context);
    final isTablet = ResponsiveLayout.isTablet(context);
    final showHamburger = isTablet;

    const allDestinations = [
      NavigationDestination(icon: Icon(Icons.point_of_sale), label: 'POS'),
      NavigationDestination(icon: Icon(Icons.dashboard), label: 'Dashboard'),
      NavigationDestination(icon: Icon(Icons.inventory), label: 'Produk'),
      NavigationDestination(icon: Icon(Icons.people), label: 'Pelanggan'),
      NavigationDestination(icon: Icon(Icons.bar_chart), label: 'Laporan'),
      NavigationDestination(icon: Icon(Icons.store), label: 'Supplier'),
      NavigationDestination(icon: Icon(Icons.shopping_cart), label: 'Pembelian'),
      NavigationDestination(icon: Icon(Icons.payment), label: 'Hutang'),
      NavigationDestination(icon: Icon(Icons.settings), label: 'Pengaturan'),
    ];

    const mobileDestinationIndices = [0, 1, 2, 4];
    final mobileDestinations = mobileDestinationIndices
        .map((index) => allDestinations[index])
        .toList();

    int currentIndex = widget.navigationShell.currentIndex;
    if (isMobile && !showHamburger) {
      final inMobileIndex = mobileDestinationIndices.indexOf(currentIndex);
      if (inMobileIndex == -1) {
        Future.microtask(() {
          if (context.mounted) {
            widget.navigationShell.goBranch(0);
          }
        });
        currentIndex = 0;
      } else {
        currentIndex = inMobileIndex;
      }
    }

    return Scaffold(
      body: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _closeMenu,
        child: Stack(
          children: [
            widget.navigationShell,
            if (showHamburger) ...[
              Positioned(
                top: MediaQuery.of(context).padding.top + 12,
                right: 12,
                child: Material(
                  color: Colors.transparent,
                  child: IconButton(
                    icon: const Icon(Icons.menu_rounded),
                    onPressed: () {
                      _toggleMenu();
                    },
                  ),
                ),
              ),
              if (_isMenuOpen)
                Positioned(
                  top: MediaQuery.of(context).padding.top + 60,
                  right: 12,
                  child: Material(
                    elevation: 12,
                    borderRadius: BorderRadius.circular(16),
                    child: Container(
                      width: 180,
                      decoration: BoxDecoration(
                        color: Theme.of(context).colorScheme.surface,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: mobileDestinationIndices.map((index) {
                          final destination = allDestinations[index];
                          final selected = widget.navigationShell.currentIndex == index;
                          return ListTile(
                            leading: destination.icon,
                            title: Text(destination.label),
                            selected: selected,
                            onTap: () {
                              widget.navigationShell.goBranch(index);
                              _closeMenu();
                            },
                          );
                        }).toList(),
                      ),
                    ),
                  ),
                ),
            ],
          ],
        ),
      ),
      bottomNavigationBar: showHamburger
          ? null
          : NavigationBar(
              selectedIndex: currentIndex,
              onDestinationSelected: (index) {
                if (isMobile) {
                  final actualIndex = mobileDestinationIndices[index];
                  widget.navigationShell.goBranch(actualIndex);
                } else {
                  widget.navigationShell.goBranch(index);
                }
              },
              destinations: isMobile ? mobileDestinations : allDestinations,
            ),
    );
  }
}
