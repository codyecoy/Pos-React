import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_pos/core/services/api_client.dart';
import 'package:flutter_pos/core/services/product_api.dart';
import 'package:flutter_pos/core/services/category_api.dart';
import 'package:flutter_pos/features/products/data/models/product_model.dart';
import 'package:flutter_pos/features/products/data/models/category_model.dart';

final productApiProvider = Provider<ProductApi>((ref) {
  final apiClient = ApiClient();
  return ProductApi(apiClient);
});

final categoryApiProvider = Provider<CategoryApi>((ref) {
  final apiClient = ApiClient();
  return CategoryApi(apiClient);
});

final productsProvider = FutureProvider<List<ProductModel>>((ref) async {
  final api = ref.watch(productApiProvider);
  return await api.getAll();
});

final categoriesProvider = FutureProvider<List<CategoryModel>>((ref) async {
  final api = ref.watch(categoryApiProvider);
  return await api.getAll();
});

final selectedCategoryProvider = StateProvider<String?>((ref) => null);
