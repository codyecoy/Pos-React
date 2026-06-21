import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_pos/core/services/api_client.dart';
import 'package:flutter_pos/core/services/product_api.dart';
import 'package:flutter_pos/core/services/category_api.dart';
import 'package:flutter_pos/features/products/data/models/product_model.dart';
import 'package:flutter_pos/features/products/data/models/category_model.dart';

final productApiProvider = Provider<ProductApi>((ref) {
  final apiClient = ApiClient();
  return ProductApi(apiClient.dio);
});

final categoryApiProvider = Provider<CategoryApi>((ref) {
  final apiClient = ApiClient();
  return CategoryApi(apiClient.dio);
});

final masterSegmentProvider = StateProvider<String>((ref) => 'cafe');

final masterProductsProvider = FutureProvider<List<ProductModel>>((ref) async {
  final api = ref.watch(productApiProvider);
  final segment = ref.watch(masterSegmentProvider);
  final data = await api.getMasterProducts(segment);
  return data.map((item) {
    return ProductModel(
      id: item['id'] as String? ?? '',
      name: item['name'] as String? ?? '',
      price: (item['price'] as num?)?.toDouble() ?? 0.0,
      costPrice: (item['costPrice'] as num?)?.toDouble() ?? 0.0,
      stock: 100, // Default stock for master products
      category: item['category'] as String? ?? '',
      image: item['image'] as String? ?? '',
      barcode: item['barcode'] as String? ?? '',
      sku: item['sku'] as String? ?? '',
      status: item['status'] as String?,
    );
  }).toList();
});

final productsProvider = FutureProvider<List<ProductModel>>((ref) async {
  final api = ref.watch(productApiProvider);
  final data = await api.getAll();
  return data.map((item) {
    return ProductModel(
      id: item['id'] as String? ?? '',
      name: item['name'] as String? ?? '',
      price: (item['price'] as num?)?.toDouble() ?? 0.0,
      costPrice: (item['costPrice'] as num?)?.toDouble() ?? 0.0,
      stock: (item['stock'] as num?)?.toInt() ?? 0,
      category: item['category'] as String? ?? '',
      image: item['image'] as String? ?? '',
      barcode: item['barcode'] as String? ?? '',
      sku: item['sku'] as String? ?? '',
      status: item['status'] as String?,
      createdAt: item['createdAt'] != null ? DateTime.tryParse(item['createdAt'] as String) : null,
      updatedAt: item['updatedAt'] != null ? DateTime.tryParse(item['updatedAt'] as String) : null,
      deletedAt: item['deletedAt'] != null ? DateTime.tryParse(item['deletedAt'] as String) : null,
      syncVersion: (item['syncVersion'] as num?)?.toInt() ?? 1,
    );
  }).toList();
});

final categoriesProvider = FutureProvider<List<CategoryModel>>((ref) async {
  // First try to get categories from products
  final products = await ref.watch(productsProvider.future);
  final productCategories = products.map((p) => p.category).toSet().toList()
    ..sort();
  
  // Then try to get from API
  try {
    final api = ref.watch(categoryApiProvider);
    final data = await api.getAll();
    if (data.isNotEmpty) {
      return data.map((item) {
        return CategoryModel(
          id: item['id'] as String? ?? '',
          name: item['name'] as String? ?? '',
          icon: item['icon'] as String?,
          createdAt: item['createdAt'] != null ? DateTime.tryParse(item['createdAt'] as String) : null,
          updatedAt: item['updatedAt'] != null ? DateTime.tryParse(item['updatedAt'] as String) : null,
          deletedAt: item['deletedAt'] != null ? DateTime.tryParse(item['deletedAt'] as String) : null,
          syncVersion: (item['syncVersion'] as num?)?.toInt() ?? 1,
        );
      }).toList();
    }
  } catch (_) {
    // Ignore if API fails
  }
  
  // If no categories from API, create from product categories
  return productCategories.asMap().entries.map((entry) {
    return CategoryModel(
      id: entry.value,
      name: entry.value,
    );
  }).toList();
});

final selectedCategoryProvider = StateProvider<String?>((ref) => null);
