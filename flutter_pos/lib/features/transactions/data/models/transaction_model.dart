class CartItemModel {
  final String id;
  final String name;
  final double price;
  final double costPrice;
  final int stock;
  final String category;
  final String image;
  final String barcode;
  final String sku;
  int quantity;
  double discount;
  final String? note;

  CartItemModel({
    required this.id,
    required this.name,
    required this.price,
    required this.costPrice,
    required this.stock,
    required this.category,
    required this.image,
    required this.barcode,
    required this.sku,
    required this.quantity,
    required this.discount,
    this.note,
  });

  CartItemModel copyWith({
    String? id,
    String? name,
    double? price,
    double? costPrice,
    int? stock,
    String? category,
    String? image,
    String? barcode,
    String? sku,
    int? quantity,
    double? discount,
    String? note,
  }) {
    return CartItemModel(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      costPrice: costPrice ?? this.costPrice,
      stock: stock ?? this.stock,
      category: category ?? this.category,
      image: image ?? this.image,
      barcode: barcode ?? this.barcode,
      sku: sku ?? this.sku,
      quantity: quantity ?? this.quantity,
      discount: discount ?? this.discount,
      note: note ?? this.note,
    );
  }
}

class TransactionModel {
  final String id;
  final List<CartItemModel> items;
  final double subtotal;
  final double tax;
  final double discountTotal;
  final double total;
  final String paymentMethod;
  final double amountPaid;
  final double changeAmount; // <-- Fixed: backend uses changeAmount, not change
  final DateTime timestamp;
  final String cashierId;
  final String? customerId;
  final String status;

  TransactionModel({
    required this.id,
    required this.items,
    required this.subtotal,
    required this.tax,
    required this.discountTotal,
    required this.total,
    required this.paymentMethod,
    required this.amountPaid,
    required this.changeAmount,
    required this.timestamp,
    required this.cashierId,
    this.customerId,
    required this.status,
  });
}
