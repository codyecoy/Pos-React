import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:flutter_pos/core/theme/app_colors.dart';
import 'package:flutter_pos/core/utils/responsive_layout.dart';
import 'package:flutter_pos/shared/widgets/app_card.dart';
import 'package:flutter_pos/shared/widgets/app_input.dart';
import 'package:flutter_pos/shared/widgets/app_button.dart';
import 'package:flutter_pos/shared/widgets/product_card.dart';
import 'package:flutter_pos/features/cashier/presentation/providers/cart_provider.dart';
import 'package:flutter_pos/features/cashier/presentation/providers/payment_provider.dart';
import 'package:flutter_pos/features/products/data/models/product_model.dart';
import 'package:flutter_pos/features/products/data/models/category_model.dart';
import 'package:flutter_pos/features/products/presentation/providers/products_provider.dart';

class CashierPage extends ConsumerStatefulWidget {
  const CashierPage({super.key});

  @override
  ConsumerState<CashierPage> createState() => _CashierPageState();
}

class _CashierPageState extends ConsumerState<CashierPage> {
  final TextEditingController _searchController = TextEditingController();
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(() {
      setState(() {}); // Rebuild on search input change
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  String _formatCurrency(double amount) {
    return NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    ).format(amount);
  }

  List<ProductModel> _filterProducts(List<ProductModel> products) {
    String search = _searchController.text.toLowerCase();
    return products.where((product) {
      bool matchesSearch = search.isEmpty || 
          product.name.toLowerCase().contains(search);
      bool matchesCategory = _selectedCategory == null || 
          product.category == _selectedCategory;
      return matchesSearch && matchesCategory;
    }).toList();
  }

  Future<void> _handleCheckout(BuildContext context, WidgetRef ref) async {
    final cartNotifier = ref.read(cartProvider.notifier);
    if (cartNotifier.total == 0) return;

    final paymentNotifier = ref.read(paymentProvider.notifier);
    paymentNotifier.initialize(cartNotifier.total);
    final isTablet = ResponsiveLayout.isTablet(context);

    if (!isTablet) {
      final proceed = await _showCartReviewBottomSheet(context, ref, cartNotifier);
      if (proceed != true) return;
      if (!mounted) return;
    }

    if (!mounted) return;
    final result = await _showPaymentDrawer(context, cartNotifier);
    if (!mounted) return;

    if (result != null) {
      cartNotifier.clearCart();
      final messenger = ScaffoldMessenger.of(context);
      messenger.showSnackBar(
        const SnackBar(
          content: Text('Transaksi berhasil!'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<bool?> _showCartReviewBottomSheet(
    BuildContext context,
    WidgetRef ref,
    CartNotifier cartNotifier,
  ) {
    final colors = Theme.of(context).extension<AppColors>()!;
    final cart = ref.read(cartProvider);

    return showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Container(
                  width: 40,
                  height: 5,
                  decoration: BoxDecoration(
                    color: colors.onSurfaceVariant.withAlpha(100),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Review Keranjang',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 16),
                ConstrainedBox(
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(context).size.height * 0.55,
                  ),
                  child: cart.isEmpty
                      ? Center(
                          child: Text(
                            'Keranjang kosong',
                            style: Theme.of(context).textTheme.bodyLarge,
                          ),
                        )
                      : ListView.separated(
                          shrinkWrap: true,
                          padding: EdgeInsets.zero,
                          itemCount: cart.length,
                          separatorBuilder: (context, index) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final item = cart[index];
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                item.name,
                                style: Theme.of(context).textTheme.titleMedium,
                              ),
                              subtitle: Text(
                                '${item.quantity} x ${_formatCurrency(item.price)}',
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      color: colors.onSurfaceVariant,
                                    ),
                              ),
                              trailing: Text(
                                _formatCurrency(item.price * item.quantity),
                                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                      fontWeight: FontWeight.w700,
                                    ),
                              ),
                            );
                          },
                        ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total'),
                    Text(
                      _formatCurrency(cartNotifier.total),
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                AppButton(
                  text: 'Lanjut ke Pembayaran',
                  variant: AppButtonVariant.success,
                  fullWidth: true,
                  onPressed: () => Navigator.of(context).pop(true),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Future<Map<String, dynamic>?> _showPaymentDrawer(
    BuildContext context,
    CartNotifier cartNotifier,
  ) {
    return showGeneralDialog<Map<String, dynamic>?>(
      context: context,
      barrierDismissible: true,
      barrierLabel: 'Tutup pembayaran',
      barrierColor: Colors.black54,
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, animation, secondaryAnimation) {
        return PaymentDrawer(cartNotifier: cartNotifier);
      },
      transitionBuilder: (context, animation, secondaryAnimation, child) {
        final curvedValue = Curves.easeOut.transform(animation.value);
        return Stack(
          children: [
            GestureDetector(
              onTap: () => Navigator.of(context).pop(),
              child: Opacity(
                opacity: curvedValue * 0.45,
                child: Container(color: Colors.black),
              ),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: FractionalTranslation(
                translation: Offset(1 - curvedValue, 0),
                child: child,
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<AppColors>()!;
    final cart = ref.watch(cartProvider);
    final cartNotifier = ref.read(cartProvider.notifier);
    final isTablet = ResponsiveLayout.isTablet(context);
    final productsAsync = ref.watch(productsProvider);
    final masterProductsAsync = ref.watch(masterProductsProvider);

    // Get products, prefer store products, fall back to master
    List<ProductModel> products = [];
    List<CategoryModel> categories = [];
    bool isLoading = true;
    Object? error;

    // First try to get store products
    if (productsAsync.hasValue) {
      products = productsAsync.value!;
      isLoading = false;
    } else if (productsAsync.hasError) {
      error = productsAsync.error;
    } else {
      isLoading = true;
    }

    // If store products are empty, use master products
    if (products.isEmpty && masterProductsAsync.hasValue) {
      products = masterProductsAsync.value!;
      isLoading = false;
    } else if (products.isEmpty && masterProductsAsync.hasError) {
      error = masterProductsAsync.error;
    }

    // Generate categories from products
    final categoryNames = products.map((p) => p.category).toSet().toList()..sort();
    categories = categoryNames.map((name) => CategoryModel(id: name, name: name)).toList();

    Widget productGrid() {
      final filteredProducts = _filterProducts(products);
      return Column(
        children: [
          SizedBox(
            height: 48,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: categories.length + 1,
              separatorBuilder: (context, index) =>
                  const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final categoryName = index == 0 ? 'Semua' : categories[index - 1].name;
                final isSelected = index == 0 
                    ? _selectedCategory == null 
                    : _selectedCategory == categories[index - 1].name;
                return FilterChip(
                  label: Text(categoryName),
                  selected: isSelected,
                  onSelected: (selected) {
                    setState(() {
                      _selectedCategory = index == 0 ? null : categories[index - 1].name;
                    });
                  },
                  backgroundColor:
                      isSelected ? colors.primary : colors.surfaceVariant,
                  selectedColor: colors.primary,
                  labelStyle: TextStyle(
                    color: isSelected
                        ? colors.onPrimary
                        : colors.onSurfaceVariant,
                    fontWeight:
                        isSelected ? FontWeight.w600 : FontWeight.w400,
                  ),
                  side: BorderSide.none,
                  shape: const StadiumBorder(),
                );
              },
            ),
          ),
          const SizedBox(height: 20),
          Expanded(
            child: LayoutBuilder(
              builder: (context, constraints) {
                // Grid tablet 10": 4-6 kolom
                // Grid desktop: 6-8 kolom
                final crossAxisCount = constraints.maxWidth >= 1600
                    ? 8
                    : constraints.maxWidth >= 1400
                        ? 7
                        : constraints.maxWidth >= 1200
                            ? 6
                            : constraints.maxWidth >= 1000
                                ? 5
                                : constraints.maxWidth >= 800
                                    ? 4
                                    : constraints.maxWidth >= 600
                                        ? 3
                                        : constraints.maxWidth >= 400
                                            ? 2
                                            : 1;

                final childAspectRatio = constraints.maxWidth < 500 ? 0.88 : 0.75;
                return GridView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: crossAxisCount,
                    crossAxisSpacing: 8,
                    mainAxisSpacing: 8,
                    childAspectRatio: childAspectRatio,
                  ),
                  itemCount: filteredProducts.length,
                  itemBuilder: (context, index) {
                    final product = filteredProducts[index];
                    return ProductCard(
                      id: product.id,
                      name: product.name,
                      price: product.price,
                      stock: product.stock,
                      category: product.category,
                      imageUrl: product.image,
                      onAddToCart: () {
                        cartNotifier.addItem(product);
                      },
                    );
                  },
                );
              },
            ),
          ),
        ],
      );
    }

    Widget cartPanel() {
      return Column(
        children: [
          Expanded(
            child: cart.isEmpty
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.shopping_cart_outlined,
                        size: 80,
                        color:
                            colors.onSurfaceVariant.withValues(alpha: 0.5),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Keranjang kosong',
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: colors.onSurfaceVariant,
                            ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Tambahkan produk untuk memulai',
                        style:
                            Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: colors.onSurfaceVariant,
                            ),
                      ),
                    ],
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    itemCount: cart.length,
                    separatorBuilder: (context, index) =>
                        const Divider(height: 1),
                    itemBuilder: (context, index) {
                      final item = cart[index];
                      return ListTile(
                        title: Text(
                          item.name,
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        subtitle: Text(
                          _formatCurrency(item.price),
                          style:
                              Theme.of(context).textTheme.bodyMedium?.copyWith(
                                    color: colors.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              icon:
                                  const Icon(Icons.remove_circle_outline),
                              onPressed: () {
                                cartNotifier.updateQuantity(
                                  item.id,
                                  item.quantity - 1,
                                );
                              },
                            ),
                            Container(
                              width: 40,
                              alignment: Alignment.center,
                              child: Text(
                                item.quantity.toString(),
                                style: Theme.of(context)
                                    .textTheme
                                    .titleMedium
                                    ?.copyWith(
                                      fontWeight: FontWeight.w600,
                                    ),
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline),
                              onPressed: () {
                                cartNotifier.updateQuantity(
                                  item.id,
                                  item.quantity + 1,
                                );
                              },
                            ),
                            IconButton(
                              icon: Icon(
                                Icons.delete_outline,
                                color: colors.danger,
                              ),
                              onPressed: () {
                                cartNotifier.removeItem(item.id);
                              },
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          if (cart.isNotEmpty) ...[
            const Divider(),
            Padding(
              padding:
                  const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Subtotal'),
                      Text(_formatCurrency(cartNotifier.subtotal)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Pajak (10%)'),
                      Text(_formatCurrency(cartNotifier.tax)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Total',
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      Text(
                        _formatCurrency(cartNotifier.total),
                        style: Theme.of(context)
                            .textTheme
                            .titleLarge
                            ?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: colors.primary,
                            ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  AppButton(
                    text: 'Checkout',
                    onPressed: () => _handleCheckout(context, ref),
                    variant: AppButtonVariant.success,
                    fullWidth: true,
                    icon: Icons.payment_rounded,
                    size: AppButtonSize.lg,
                  ),
                ],
              ),
            ),
          ],
        ],
      );
    }

    Widget floatingCart() {
      return Container(
        width: double.infinity,
        decoration: BoxDecoration(
          color: colors.surface,
          boxShadow: [
            BoxShadow(
              color: colors.shadow,
              blurRadius: 24,
              offset: const Offset(0, -8),
            ),
          ],
        ),
        padding: const EdgeInsets.all(16),
        margin: EdgeInsets.only(
          bottom: MediaQuery.of(context).padding.bottom,
        ),
        child: SafeArea(
          top: false,
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '${cartNotifier.totalItems} items',
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: colors.onSurfaceVariant,
                          ),
                    ),
                    Text(
                      _formatCurrency(cartNotifier.total),
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            color: colors.primary,
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                  ],
                ),
              ),
              AppButton(
                text: 'Checkout',
                onPressed: () => _handleCheckout(context, ref),
                variant: AppButtonVariant.success,
                icon: Icons.payment_rounded,
              ),
            ],
          ),
        ),
      );
    }

    Widget bodyWidget() {
      if (isLoading) {
        return const Center(child: CircularProgressIndicator());
      }
      if (error != null) {
        return Center(child: Text('Error: $error'));
      }
      return isTablet
          ? Row(
              children: [
                Expanded(
                  flex: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        AppInput(
                          controller: _searchController,
                          labelText: 'Cari produk',
                          prefixIcon: const Icon(Icons.search_rounded),
                        ),
                        const SizedBox(height: 16),
                        Expanded(child: productGrid()),
                      ],
                    ),
                  ),
                ),
                Container(
                  width: 400,
                  decoration: BoxDecoration(
                    color: colors.surface,
                    border: Border(
                      left: BorderSide(
                        color: colors.outlineVariant,
                      ),
                    ),
                  ),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            Text(
                              'Keranjang',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleLarge
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            const Spacer(),
                            if (cart.isNotEmpty)
                              TextButton.icon(
                                onPressed: () => cartNotifier.clearCart(),
                                icon: Icon(
                                  Icons.delete_outline,
                                  color: colors.danger,
                                ),
                                label: Text(
                                  'Hapus',
                                  style: TextStyle(color: colors.danger),
                                ),
                              ),
                          ],
                        ),
                      ),
                      Expanded(child: cartPanel()),
                    ],
                  ),
                ),
              ],
            )
          : Stack(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      AppInput(
                        controller: _searchController,
                        labelText: 'Cari produk',
                        prefixIcon: const Icon(Icons.search_rounded),
                      ),
                      const SizedBox(height: 16),
                      Expanded(child: productGrid()),
                    ],
                  ),
                ),
                if (cart.isNotEmpty)
                  Positioned(
                    left: 0,
                    right: 0,
                    bottom: 0,
                    child: floatingCart(),
                  ),
              ],
            );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('POS'),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined),
            onPressed: () {},
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: SafeArea(child: bodyWidget()),
    );
  }
}

class PaymentDrawer extends ConsumerStatefulWidget {
  final CartNotifier cartNotifier;
  const PaymentDrawer({super.key, required this.cartNotifier});

  @override
  ConsumerState<PaymentDrawer> createState() => _PaymentDrawerState();
}

class _PaymentDrawerState extends ConsumerState<PaymentDrawer> {

  String _paymentMethodLabel(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.cash:
        return 'Cash';
      case PaymentMethod.qris:
        return 'QRIS';
      case PaymentMethod.debit:
        return 'Debit';
      case PaymentMethod.creditCard:
        return 'Kredit';
      case PaymentMethod.bankTransfer:
        return 'Transfer';
      case PaymentMethod.eWallet:
        return 'E-Wallet';
    }
  }

  IconData _paymentMethodIcon(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.cash:
        return Icons.money;
      case PaymentMethod.qris:
        return Icons.qr_code;
      case PaymentMethod.debit:
        return Icons.credit_card;
      case PaymentMethod.creditCard:
        return Icons.payment;
      case PaymentMethod.bankTransfer:
        return Icons.account_balance;
      case PaymentMethod.eWallet:
        return Icons.wallet;
    }
  }

  Widget _buildNumericPad(BuildContext context, PaymentNotifier paymentNotifier, double amountPaid) {
    final digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Numeric pad only (no duplicate nominal box)
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          crossAxisSpacing: 6,
          mainAxisSpacing: 6,
          physics: const NeverScrollableScrollPhysics(),
          children: digits.map((digit) {
            return AppButton(
              text: digit.toString(),
              size: AppButtonSize.xs,
              variant: AppButtonVariant.secondary,
              onPressed: () => paymentNotifier.appendDigit(digit),
            );
          }).toList(),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: AppButton(
                text: 'Clear',
                variant: AppButtonVariant.danger,
                onPressed: paymentNotifier.clearAmount,
                size: AppButtonSize.xs,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: AppButton(
                text: 'Bcksp',
                variant: AppButtonVariant.warning,
                onPressed: paymentNotifier.removeLastDigit,
                size: AppButtonSize.xs,
              ),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<AppColors>()!;
    final paymentState = ref.watch(paymentProvider);
    final paymentNotifier = ref.read(paymentProvider.notifier);
    final amountPaid = paymentState.paymentAmount;
    final hasEnough = paymentState.hasEnoughPayment;
    final size = MediaQuery.of(context).size;
    final width = size.width < 380 ? size.width : 380.0;

    return Align(
      alignment: Alignment.centerRight,
      child: Material(
        color: Theme.of(context).colorScheme.surface,
        elevation: 20,
        child: SizedBox(
          width: width,
          height: size.height,
          child: SafeArea(
            left: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          'Pembayaran',
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ),
                      IconButton(
                        onPressed: () => Navigator.of(context).pop(),
                        icon: Icon(Icons.close, color: colors.onSurface),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Expanded(
                    child: SingleChildScrollView(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          AppCard(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Total Pembayaran',
                                  style: Theme.of(context).textTheme.labelMedium?.copyWith(
                                        color: colors.onSurfaceVariant,
                                      ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _formatCurrency(widget.cartNotifier.total),
                                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                        fontWeight: FontWeight.w700,
                                        color: colors.primary,
                                      ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Metode Pembayaran',
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              PaymentMethod.cash,
                              PaymentMethod.qris,
                              PaymentMethod.bankTransfer,
                            ].map((method) {
                              final selected = paymentState.paymentMethod == method;
                              return ChoiceChip(
                                label: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      _paymentMethodIcon(method),
                                      size: 16,
                                      color: selected ? colors.onPrimary : colors.onSurface,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(_paymentMethodLabel(method)),
                                  ],
                                ),
                                selected: selected,
                                onSelected: (_) => paymentNotifier.setPaymentMethod(method),
                                backgroundColor: colors.surfaceVariant,
                                selectedColor: colors.primary,
                                labelStyle: TextStyle(
                                  color: selected ? colors.onPrimary : colors.onSurface,
                                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                                ),
                              );
                            }).toList(),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Jumlah Bayar',
                            style: Theme.of(context).textTheme.labelLarge,
                          ),
                          const SizedBox(height: 8),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            decoration: BoxDecoration(
                              color: colors.surfaceVariant,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _formatCurrency(amountPaid),
                                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                        fontWeight: FontWeight.w700,
                                      ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  hasEnough ? 'Sudah mencukupi' : 'Belum cukup',
                                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                        color: hasEnough ? colors.success : colors.danger,
                                      ),
                                ),
                                const SizedBox(height: 8),
                                _buildNumericPad(context, paymentNotifier, amountPaid),
                              ],
                            ),
                          ),
                          const SizedBox(height: 8),
                        ],
                      ),
                    ),
                  ),
                  AppButton(
                    text: 'Bayar Sekarang',
                    onPressed: hasEnough
                        ? () => Navigator.of(context).pop({
                              'paymentMethod': _paymentMethodLabel(paymentState.paymentMethod),
                              'amountPaid': amountPaid,
                            })
                        : null,
                    variant: AppButtonVariant.success,
                    fullWidth: true,
                    size: AppButtonSize.lg,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  String _formatCurrency(double amount) {
    return NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0,
    ).format(amount);
  }
}
