import 'package:flutter_pos/core/services/api_client.dart';
import 'package:flutter_pos/core/services/auth_api.dart';
import 'package:flutter_pos/features/auth/data/models/user_model.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_pos/core/constants/app_constants.dart';

class AuthRepository {
  final AuthApi _authApi;

  AuthRepository(this._authApi);

  Future<UserModel> login(String email, String password) async {
    final data = await _authApi.login(email, password);
    final user = UserModel.fromJson(data['user']);
    final token = data['token'];

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.tokenKey, token);

    return user;
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(AppConstants.tokenKey);
  }
}
