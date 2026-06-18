import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_pos/features/auth/data/models/user_model.dart';
import 'package:flutter_pos/features/auth/data/repositories/auth_repository.dart';
import 'package:flutter_pos/core/services/api_client.dart';
import 'package:flutter_pos/core/services/auth_api.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ApiClient();
  return AuthRepository(AuthApi(apiClient));
});

final authStateProvider = StateNotifierProvider<AuthNotifier, AsyncValue<UserModel?>>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return AuthNotifier(repo);
});

class AuthNotifier extends StateNotifier<AsyncValue<UserModel?>> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(const AsyncData(null)) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    state = const AsyncLoading();
    try {
      final isLoggedIn = await _repository.isLoggedIn();
      state = AsyncData(isLoggedIn ? null : null);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    try {
      final user = await _repository.login(email, password);
      state = AsyncData(user);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> logout() async {
    state = const AsyncLoading();
    try {
      await _repository.logout();
      state = const AsyncData(null);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }
}
