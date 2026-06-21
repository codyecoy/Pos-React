import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_pos/features/products/data/models/product_model.dart';
import 'package:flutter_pos/features/transactions/data/models/transaction_model.dart';

class CartNotifier extends StateNotifier<List<CartItemModel>> {
  CartNotifier() : super([]);

  void addItem(ProductModel product) {
    final existingIndex = state.indexWhere((item) => item.id == product.id);
    if (existingIndex >= 0) {
      final newState = [...state];
      newState[existingIndex] = newState[existingIndex].copyWith(
        quantity: newState[existingIndex].quantity + 1,
      );
      state = newState;
    } else {
      state = [
        ...state,
        CartItemModel(
          id: product.id,
          name: product.name,
          price: product.price,
          costPrice: product.costPrice,
          stock: product.stock,
          category: product.category,
          image: product.image,
          barcode: product.barcode,
          sku: product.sku,
          quantity: 1,
          discount: 0,
        )
      ];
    }
  }

  void updateQuantity(String productId, int quantity) {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    final newState = state.map((item) {
      if (item.id == productId) {
        return item.copyWith(quantity: quantity);
      }
      return item;
    }).toList();
    state = newState;
  }

  void updateDiscount(String productId, double discount) {
    final newState = state.map((item) {
      if (item.id == productId) {
        return item.copyWith(discount: discount);
      }
      return item;
    }).toList();
    state = newState;
  }

  void removeItem(String productId) {
    state = state.where((item) => item.id != productId).toList();
  }

  void clearCart() {
    state = [];
  }

  // Calculations
  double get subtotal => state.fold(
      0, (sum, item) => sum + (item.price * item.quantity));

  double get discountTotal => state.fold(
      0, (sum, item) => sum + item.discount);

  // Default tax rate: adjust as needed (or get from settings)
  double get taxRate => 0.1; // 10%

  double get tax => (subtotal - discountTotal) * taxRate;

  double get total => (subtotal - discountTotal) + tax;

  int get totalItems => state.fold(0, (sum, item) => sum + item.quantity);

  // Prepare transaction data for API
  Map<String, dynamic> toTransactionData({
    required String paymentMethod,
    required double amountPaid,
    String? customerId,
    String? cashierId,
    String? storeId,
  }) {
    return {
      'storeId': storeId,
      'cashierId': cashierId,
      'customerId': customerId,
      'items': state.map((item) => {
        'productId': item.id,
        'name': item.name,
        'price': item.price,
        'costPrice': item.costPrice,
        'quantity': item.quantity,
        'discount': item.discount,
        'subtotal': (item.price * item.quantity) - item.discount,
      }).toList(),
      'subtotal': subtotal,
      'tax': tax,
      'discountTotal': discountTotal,
      'total': total,
      'paymentMethod': paymentMethod,
      'amountPaid': amountPaid,
      'changeAmount': amountPaid - total,
    };
  }
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItemModel>>((ref) {
  return CartNotifier();
});
