import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_pos/core/constants/app_constants.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  late final Dio dio;
  bool _isInitialized = false;

  Future<void> init() async {
    if (_isInitialized) return;

    dio = Dio(BaseOptions(
      baseUrl: AppConstants.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 120),
      headers: {'Content-Type': 'application/json'},
    ));
    if (!kReleaseMode) {
      debugPrint('🌐 API_BASE_URL: ${AppConstants.baseUrl}');
    }

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        if (!kReleaseMode) {
          debugPrint('📤 Request: ${options.method} ${options.uri}');
          debugPrint('📤 Headers: ${options.headers}');
        }
        final prefs = await SharedPreferences.getInstance();
        final token = prefs.getString(AppConstants.tokenKey);
        final tenantId = prefs.getString(AppConstants.tenantIdKey);
        final storeId = prefs.getString(AppConstants.storeIdKey);
        final requestPath = (options.path.isNotEmpty ? options.path : options.uri.path).toLowerCase();
        final isAuthRoute = requestPath.contains('/auth/login') || requestPath.contains('/auth/register') || requestPath.contains('/auth/refresh');

        if (isAuthRoute) {
          options.headers.remove('Authorization');
        } else if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }

        if (tenantId != null) {
          options.headers['x-tenant-id'] = tenantId;
        }
        if (storeId != null) {
          options.headers['x-store-id'] = storeId;
        }

        if (!kReleaseMode) {
          debugPrint('📤 Final headers: ${options.headers}');
        }
        return handler.next(options);
      },
      onResponse: (response, handler) {
        if (!kReleaseMode) {
          debugPrint('📥 Response: ${response.statusCode} ${response.data}');
        }
        return handler.next(response);
      },
      onError: (error, handler) async {
        if (!kReleaseMode) {
          debugPrint('❌ Error: ${error.response?.statusCode}');
          debugPrint('❌ Error Data: ${error.response?.data}');
          debugPrint('❌ Error Message: ${error.message}');
        }
        if (error.response?.statusCode == 401) {
          await _handleUnauthorized();
        }
        return handler.next(error);
      },
    ));

    _isInitialized = true;
  }

  Future<void> _handleUnauthorized() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }
}
