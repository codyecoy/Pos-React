class CategoryModel {
  final String id;
  final String name;
  final String? icon;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? deletedAt;
  final int syncVersion;

  CategoryModel({
    required this.id,
    required this.name,
    this.icon,
    this.createdAt,
    this.updatedAt,
    this.deletedAt,
    this.syncVersion = 1,
  });
}
