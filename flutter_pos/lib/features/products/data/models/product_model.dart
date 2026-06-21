class ProductModel {
  final String id;
  final String name;
  final double price;
  final double costPrice;
  final int stock;
  final String category;
  final String image;
  final String barcode;
  final String sku;
  final String? status;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? deletedAt;
  final int syncVersion;

  ProductModel({
    required this.id,
    required this.name,
    required this.price,
    required this.costPrice,
    required this.stock,
    required this.category,
    required this.image,
    required this.barcode,
    required this.sku,
    this.status,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
    this.syncVersion = 1,
  });
}
