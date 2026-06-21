import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_pos/features/auth/data/repositories/auth_repository.dart';
import 'package:flutter_pos/core/services/api_client.dart';
import 'package:flutter_pos/core/services/auth_api.dart';
import 'package:flutter_pos/features/auth/data/models/user_model.dart';
import 'package:flutter_pos/features/auth/data/models/store_model.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final apiClient = ApiClient();
  return AuthRepository(AuthApi(apiClient.dio));
});

final authStateProvider = StateNotifierProvider<AuthNotifier, AsyncValue<AuthData>>((ref) {
  final repo = ref.watch(authRepositoryProvider);
  return AuthNotifier(repo);
});

class AuthData {
  final UserModel? user;
  final List<StoreModel> stores;
  final StoreModel? currentStore;

  AuthData({
    this.user,
    this.stores = const [],
    this.currentStore,
  });
}

class AuthNotifier extends StateNotifier<AsyncValue<AuthData>> {
  final AuthRepository _repository;

  AuthNotifier(this._repository) : super(AsyncData(AuthData())) {
    _checkAuthStatus();
  }

  Future<void> _checkAuthStatus() async {
    state = const AsyncLoading();
    try {
      final isLoggedIn = await _repository.isLoggedIn();
      if (isLoggedIn) {
        final user = await _repository.getCurrentUser();
        final stores = await _repository.getStores();
        final currentStore = await _repository.getCurrentStore();
        state = AsyncData(AuthData(
          user: user,
          stores: stores,
          currentStore: currentStore,
        ));
      } else {
        state = AsyncData(AuthData());
      }
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> login(String email, String password) async {
    state = const AsyncLoading();
    try {
      final (user, stores) = await _repository.login(email, password);
      final currentStore = await _repository.getCurrentStore();
      state = AsyncData(AuthData(
        user: user,
        stores: stores,
        currentStore: currentStore,
      ));
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> logout() async {
    state = const AsyncLoading();
    try {
      await _repository.logout();
      state = AsyncData(AuthData());
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }

  Future<void> switchStore(String storeId) async {
    state = const AsyncLoading();
    try {
      await _repository.switchStore(storeId);
      final user = await _repository.getCurrentUser();
      final stores = await _repository.getStores();
      final currentStore = await _repository.getCurrentStore();
      state = AsyncData(AuthData(
        user: user,
        stores: stores,
        currentStore: currentStore,
      ));
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }
}
