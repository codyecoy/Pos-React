import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_pos/core/services/api_client.dart';
import 'package:flutter_pos/core/services/product_api.dart';
import 'package:flutter_pos/core/services/transaction_api.dart';

// Create API providers for dashboard
final productApiProvider = Provider<ProductApi>((ref) {
  final apiClient = ApiClient();
  return ProductApi(apiClient.dio);
});

final transactionApiProvider = Provider<TransactionApi>((ref) {
  final apiClient = ApiClient();
  return TransactionApi(apiClient.dio);
});

// Dashboard stats provider
final dashboardStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final productApi = ref.watch(productApiProvider);
  final transactionApi = ref.watch(transactionApiProvider);

  // Get all data
  final products = await productApi.getAll();
  final transactions = await transactionApi.getAll();

  // Calculate stats
  final totalProducts = products.length;
  final lowStock = products.where((p) => ((p['stock'] as num?)?.toInt() ?? 0) < 5).length;
  final totalTransactions = transactions.length;
  final totalRevenue = transactions.fold(0.0, (sum, t) => sum + ((t['total'] as num?)?.toDouble() ?? 0.0));
  final outOfStock = products.where((p) => ((p['stock'] as num?)?.toInt() ?? 0) == 0).length;
  final activeProducts = products.where((p) => (p['deletedAt'] as String?) == null).length;

  return {
    'totalProducts': totalProducts,
    'lowStock': lowStock,
    'totalTransactions': totalTransactions,
    'totalRevenue': totalRevenue,
    'outOfStock': outOfStock,
    'activeProducts': activeProducts,
  };
});

// Recent transactions provider (limit to 10)
final recentTransactionsProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final transactionApi = ref.watch(transactionApiProvider);
  final transactions = await transactionApi.getAll();
  return List<Map<String, dynamic>>.from(transactions.take(10));
});
