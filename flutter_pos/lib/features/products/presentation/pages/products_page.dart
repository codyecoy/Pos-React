import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_pos/core/theme/app_colors.dart';
import 'package:flutter_pos/core/theme/app_radius.dart';
import 'package:flutter_pos/shared/widgets/app_card.dart';
import 'package:flutter_pos/shared/widgets/app_loading.dart';
import 'package:flutter_pos/shared/widgets/app_error_state.dart';
import 'package:flutter_pos/shared/widgets/app_empty_state.dart';
import 'package:flutter_pos/shared/widgets/app_input.dart';
import 'package:flutter_pos/shared/widgets/product_card.dart';
import 'package:flutter_pos/shared/widgets/app_button.dart';
import 'package:flutter_pos/features/products/presentation/providers/products_provider.dart';
import 'package:flutter_pos/features/products/data/models/product_model.dart';
import 'package:flutter_pos/features/products/data/models/category_model.dart';

class ProductsPage extends ConsumerStatefulWidget {
  const ProductsPage({super.key});

  @override
  ConsumerState<ProductsPage> createState() => _ProductsPageState();
}

class _ProductsPageState extends ConsumerState<ProductsPage> {
  final TextEditingController _searchController = TextEditingController();
  String? _selectedCategory;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<ProductModel> _filterProducts(List<ProductModel> products) {
    String search = _searchController.text.toLowerCase();
    return products.where((product) {
      bool matchesSearch = search.isEmpty || product.name.toLowerCase().contains(search);
      bool matchesCategory = _selectedCategory == null || product.category == _selectedCategory;
      return matchesSearch && matchesCategory;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).extension<AppColors>()!;
    final radius = Theme.of(context).extension<AppRadius>()!;
    final productsAsync = ref.watch(productsProvider);
    final masterProductsAsync = ref.watch(masterProductsProvider);

    // Get products, prefer store products, fall back to master
    List<ProductModel> products = [];
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
    final categories = categoryNames.map((name) => CategoryModel(id: name, name: name)).toList();

    if (isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (error != null) {
      return Scaffold(body: Center(child: Text('Error: $error')));
    }

    final filteredProducts = _filterProducts(products);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar.large(
            title: const Text("Products"),
            actions: [
              IconButton(
                icon: const Icon(Icons.filter_alt_outlined),
                onPressed: () {},
              ),
              IconButton(
                icon: const Icon(Icons.sort_rounded),
                onPressed: () {},
              ),
              const SizedBox(width: 8),
            ],
          ),
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                Row(
                  children: [
                    Expanded(
                      child: AppInput(
                        controller: _searchController,
                        labelText: "Search products",
                        hintText: "Search by name or SKU",
                        prefixIcon: const Icon(Icons.search_rounded),
                        onChanged: (_) => setState(() {}),
                      ),
                    ),
                    const SizedBox(width: 16),
                    AppButton(
                      icon: Icons.add_rounded,
                      text: "Add Product",
                      onPressed: () {},
                      fullWidth: false,
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                SizedBox(
                  height: 40,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: categories.length + 1,
                    separatorBuilder: (context, index) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final categoryName = index == 0 ? "Semua" : categories[index - 1].name;
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
                        backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                        selectedColor: colors.primary,
                        labelStyle: TextStyle(
                          color: isSelected ? colors.onPrimary : colors.onSurfaceVariant,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                        ),
                        side: BorderSide.none,
                        shape: RoundedRectangleBorder(
                          borderRadius: radius.fullBorderRadius,
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 32),
                _buildProductsGrid(filteredProducts),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProductsGrid(List<ProductModel> products) {
    return LayoutBuilder(
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

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 0.7,
          ),
          itemCount: products.length,
          itemBuilder: (context, index) {
            final product = products[index];
            return ProductCard(
              id: product.id,
              name: product.name,
              price: product.price,
              stock: product.stock,
              category: product.category,
              imageUrl: product.image,
            );
          },
        );
      },
    );
  }
}
