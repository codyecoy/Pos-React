class AppConstants {
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://api-kasir.bimasolution.com',
  );

  static const double mobileBreakpoint = 600.0;

  static const String tokenKey = 'pos_token';
  static const String tenantIdKey = 'pos_tenant_id';
  static const String storeIdKey = 'pos_store_id';
}
