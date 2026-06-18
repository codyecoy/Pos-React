import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:flutter_pos/core/utils/responsive_layout.dart';
import 'package:flutter_pos/features/cashier/presentation/providers/cart_provider.dart';
import 'package:flutter_pos/features/products/presentation/providers/products_provider.dart';
import 'package:flutter_pos/features/products/data/models/product_model.dart';
import 'package:flutter_pos/features/transactions/data/models/transaction_model.dart';

class CashierPage extends ConsumerWidget {
  const CashierPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);
    final categoriesAsync = ref.watch(categoriesProvider);
    final selectedCategory = ref.watch(selectedCategoryProvider);
    final cart = ref.watch(cartProvider);
    final cartNotifier = ref.read(cartProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('POS'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(productsProvider);
              ref.invalidate(categoriesProvider);
            },
          ),
        ],
      ),
      body: ResponsiveLayout(
        mobile: _buildMobileLayout(
          context,
          ref,
          productsAsync,
          categoriesAsync,
          selectedCategory,
          cart,
          cartNotifier,
        ),
        tablet: _buildTabletLayout(
          context,
          ref,
          productsAsync,
          categoriesAsync,
          selectedCategory,
          cart,
          cartNotifier,
        ),
      ),
    );
  }

  Widget _buildMobileLayout(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<List<ProductModel>> productsAsync,
    AsyncValue<List<CategoryModel>> categoriesAsync,
    String? selectedCategory,
    List<CartItemModel> cart,
    CartNotifier cartNotifier,
  ) {
    return Column(
      children: [
        Expanded(
          child: _buildProductGrid(
            context,
            ref,
            productsAsync,
            categoriesAsync,
            selectedCategory,
            cartNotifier,
          ),
        ),
        if (cart.isNotEmpty) _buildFloatingCart(context, cart, cartNotifier),
      ],
    );
  }

  Widget _buildTabletLayout(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<List<ProductModel>> productsAsync,
    AsyncValue<List<CategoryModel>> categoriesAsync,
    String? selectedCategory,
    List<CartItemModel> cart,
    CartNotifier cartNotifier,
  ) {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: _buildProductGrid(
            context,
            ref,
            productsAsync,
            categoriesAsync,
            selectedCategory,
            cartNotifier,
          ),
        ),
        Expanded(
          flex: 1,
          child: _buildCartPanel(context, cart, cartNotifier),
        ),
      ],
    );
  }

  Widget _buildProductGrid(
    BuildContext context,
    WidgetRef ref,
    AsyncValue<List<ProductModel>> productsAsync,
    AsyncValue<List<CategoryModel>> categoriesAsync,
    String? selectedCategory,
    CartNotifier cartNotifier,
  ) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(8),
          child: TextField(
            decoration: const InputDecoration(
              hintText: 'Cari produk...',
              prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(),
            ),
          ),
        ),
        categoriesAsync.when(
          loading: () => const LinearProgressIndicator(),
          error: (error, stack) => Text('Error: $error'),
          data: (categories) => SizedBox(
            height: 50,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 8),
              itemCount: categories.length + 1,
              itemBuilder: (context, index) {
                final isAll = index == 0;
                final category = isAll ? null : categories[index - 1];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: FilterChip(
                    label: Text(isAll ? 'Semua' : category!.name),
                    selected: selectedCategory == category?.id,
                    onSelected: (selected) {
                      ref.read(selectedCategoryProvider.notifier).state =
                          selected ? category?.id : null;
                    },
                  ),
                );
              },
            ),
          ),
        ),
        Expanded(
          child: productsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (error, stack) => Center(child: Text('Error: $error')),
            data: (products) {
              final filteredProducts = selectedCategory == null
                  ? products
                  : products
                      .where((p) => p.category == selectedCategory)
                      .toList();
              return GridView.builder(
                padding: const EdgeInsets.all(8),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: ResponsiveLayout.isTablet(context) ? 4 : 2,
                  childAspectRatio: 0.8,
                  crossAxisSpacing: 8,
                  mainAxisSpacing: 8,
                ),
                itemCount: filteredProducts.length,
                itemBuilder: (context, index) {
                  final product = filteredProducts[index];
                  return Card(
                    child: InkWell(
                      onTap: () => cartNotifier.addItem(product),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            child: product.image.isNotEmpty
                                ? Image.network(
                                    product.image,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => const Icon(
                                      Icons.image,
                                      size: 64,
                                    ),
                                  )
                                : const Icon(Icons.image, size: 64),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  product.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  NumberFormat.currency(
                                    locale: 'id_ID',
                                    symbol: 'Rp ',
                                  ).format(product.price),
                                ),
                                Text('Stok: ${product.stock}'),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFloatingCart(
    BuildContext context,
    List<CartItemModel> cart,
    CartNotifier cartNotifier,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${cartNotifier.totalItems} item',
                    style: Theme.of(context).textTheme.labelMedium,
                  ),
                  Text(
                    NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ')
                        .format(cartNotifier.subtotal),
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                ],
              ),
            ),
            ElevatedButton(
              onPressed: () {
                showModalBottomSheet(
                  context: context,
                  isScrollControlled: true,
                  builder: (context) => _buildCartPanel(context, cart, cartNotifier),
                );
              },
              child: const Text('Checkout'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartPanel(
    BuildContext context,
    List<CartItemModel> cart,
    CartNotifier cartNotifier,
  ) {
    return Container(
      color: Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Column(
        children: [
          AppBar(
            title: const Text('Keranjang'),
            automaticallyImplyLeading: ResponsiveLayout.isMobile(context),
            actions: [
              if (cart.isNotEmpty)
                IconButton(
                  icon: const Icon(Icons.delete_sweep),
                  onPressed: () => cartNotifier.clearCart(),
                ),
            ],
          ),
          Expanded(
            child: cart.isEmpty
                ? const Center(child: Text('Keranjang kosong'))
                : ListView.builder(
                    padding: const EdgeInsets.all(8),
                    itemCount: cart.length,
                    itemBuilder: (context, index) {
                      final item = cart[index];
                      return Card(
                        child: ListTile(
                          leading: item.image.isNotEmpty
                              ? Image.network(
                                  item.image,
                                  width: 50,
                                  height: 50,
                                  fit: BoxFit.cover,
                                )
                              : const Icon(Icons.image),
                          title: Text(item.name),
                          subtitle: Text(
                            NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ')
                                .format(item.price),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove_circle),
                                onPressed: () => cartNotifier.updateQuantity(
                                    item.id, item.quantity - 1),
                              ),
                              SizedBox(
                                width: 40,
                                child: Text(
                                  item.quantity.toString(),
                                  textAlign: TextAlign.center,
                                  style: const TextStyle(fontSize: 18),
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add_circle),
                                onPressed: () => cartNotifier.updateQuantity(
                                    item.id, item.quantity + 1),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
          ),
          if (cart.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 8,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: SafeArea(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Total:'),
                        Text(
                          NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ')
                              .format(cartNotifier.subtotal),
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () {
                        // TODO: Implement checkout
                      },
                      style: ElevatedButton.styleFrom(
                        minimumSize: const Size.fromHeight(50),
                      ),
                      child: const Text('Checkout'),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
