import 'package:dio/dio.dart';
import 'package:flutter_pos/core/services/api_client.dart';
import 'package:flutter_pos/features/auth/data/models/user_model.dart';

class AuthApi {
  final ApiClient _apiClient;

  AuthApi(this._apiClient);

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _apiClient.dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    return response.data;
  }

  Future<Map<String, dynamic>> refreshToken() async {
    final response = await _apiClient.dio.post('/auth/refresh');
    return response.data;
  }
}
