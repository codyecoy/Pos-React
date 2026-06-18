import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_pos/features/products/data/models/product_model.dart';
import 'package:flutter_pos/features/transactions/data/models/transaction_model.dart';

class CartNotifier extends StateNotifier<List<CartItemModel>> {
  CartNotifier() : super([]);

  void addItem(ProductModel product) {
    final existingIndex = state.indexWhere((item) => item.id == product.id);
    if (existingIndex >= 0) {
      state = [
        for (int i = 0; i < state.length; i++)
          if (i == existingIndex)
            state[i].copyWith(quantity: state[i].quantity + 1)
          else
            state[i]
      ];
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
    state = [
      for (final item in state)
        if (item.id == productId)
          item.copyWith(quantity: quantity)
        else
          item
    ];
  }

  void removeItem(String productId) {
    state = state.where((item) => item.id != productId).toList();
  }

  void clearCart() {
    state = [];
  }

  double get subtotal => state.fold(0, (sum, item) => sum + (item.price * item.quantity));
  int get totalItems => state.fold(0, (sum, item) => sum + item.quantity);
}

final cartProvider = StateNotifierProvider<CartNotifier, List<CartItemModel>>((ref) {
  return CartNotifier();
});
