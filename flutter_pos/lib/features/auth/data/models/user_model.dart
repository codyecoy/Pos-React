class UserModel {
  final String id;
  final String? tenantId;
  final String name;
  final String role;
  final String? avatar;
  final String? email;

  UserModel({
    required this.id,
    this.tenantId,
    required this.name,
    required this.role,
    this.avatar,
    this.email,
  });
}
