class StoreModel {
  final String id;
  final String name;
  final String? address;
  final String? phone;

  StoreModel({
    required this.id,
    required this.name,
    this.address,
    this.phone,
  });
}
