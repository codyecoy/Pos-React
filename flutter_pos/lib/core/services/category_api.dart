import 'package:dio/dio.dart';
import 'package:flutter_pos/core/services/api_client.dart';
import 'package:flutter_pos/features/products/data/models/category_model.dart';

class CategoryApi {
  final ApiClient _apiClient;

  CategoryApi(this._apiClient);

  Future<List<CategoryModel>> getAll() async {
    final response = await _apiClient.dio.get('/categories');
    return (response.data as List)
        .map((e) => CategoryModel.fromJson(e))
        .toList();
  }
}
