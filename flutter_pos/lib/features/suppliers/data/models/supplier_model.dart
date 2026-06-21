class SupplierModel {
  final String id;
  final String name;
  final String? phone;
  final String? email;
  final String? address;
  final String category;
  final double totalPurchased;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? deletedAt;
  final int syncVersion;

  SupplierModel({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.address,
    required this.category,
    required this.totalPurchased,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
    this.syncVersion = 1,
  });
}
