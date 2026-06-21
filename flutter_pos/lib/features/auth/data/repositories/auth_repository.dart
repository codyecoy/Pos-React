import 'dart:convert';
import 'package:flutter_pos/core/services/auth_api.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_pos/core/constants/app_constants.dart';
import 'package:flutter_pos/features/auth/data/models/user_model.dart';
import 'package:flutter_pos/features/auth/data/models/store_model.dart';

class AuthRepository {
  final AuthApi _authApi;

  AuthRepository(this._authApi);

  Future<(UserModel, List<StoreModel>)> login(String email, String password) async {
    final data = await _authApi.login(email, password);
    final token = data['token'] as String;
    final userJson = data['user'] as Map<String, dynamic>;
    final storesJson = data['stores'] as List;
    final tenantId = userJson['tenantId'] as String;
    final storeId = (storesJson.first as Map<String, dynamic>)['id'] as String;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.tokenKey, token);
    await prefs.setString(AppConstants.tenantIdKey, tenantId);
    await prefs.setString(AppConstants.storeIdKey, storeId);

    final user = UserModel(
      id: userJson['id'] as String,
      name: userJson['name'] as String,
      role: userJson['role'] as String? ?? 'user',
    );

    final stores = storesJson.map((s) {
      final map = s as Map<String, dynamic>;
      return StoreModel(
        id: map['id'] as String,
        name: map['name'] as String,
        address: map['address'] as String?,
        phone: map['phone'] as String?,
      );
    }).toList();

    await prefs.setString('pos_current_user', jsonEncode(userJson));
    await prefs.setString('pos_stores', jsonEncode(storesJson));

    return (user, stores);
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
  }

  Future<bool> isLoggedIn() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.containsKey(AppConstants.tokenKey);
  }

  Future<UserModel?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString('pos_current_user');
    if (json == null) return null;
    final userJson = jsonDecode(json) as Map<String, dynamic>;
    return UserModel(
      id: userJson['id'] as String,
      name: userJson['name'] as String,
      role: userJson['role'] as String? ?? 'user',
    );
  }

  Future<StoreModel?> getCurrentStore() async {
    final stores = await getStores();
    if (stores.isEmpty) return null;
    final prefs = await SharedPreferences.getInstance();
    final storeId = prefs.getString(AppConstants.storeIdKey);
    if (storeId == null) return stores.first;
    try {
      return stores.firstWhere((s) => s.id == storeId);
    } catch (e) {
      return stores.first;
    }
  }

  Future<List<StoreModel>> getStores() async {
    final prefs = await SharedPreferences.getInstance();
    final json = prefs.getString('pos_stores');
    if (json == null) return [];
    final storesJson = jsonDecode(json) as List;
    return storesJson.map((s) {
      final map = s as Map<String, dynamic>;
      return StoreModel(
        id: map['id'] as String,
        name: map['name'] as String,
        address: map['address'] as String?,
        phone: map['phone'] as String?,
      );
    }).toList();
  }

  Future<void> switchStore(String storeId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.storeIdKey, storeId);
  }
}
