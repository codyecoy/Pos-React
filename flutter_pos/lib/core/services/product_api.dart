import 'package:dio/dio.dart';
import 'package:flutter_pos/core/services/api_client.dart';
import 'package:flutter_pos/features/products/data/models/product_model.dart';

class ProductApi {
  final ApiClient _apiClient;

  ProductApi(this._apiClient);

  Future<List<ProductModel>> getAll() async {
    final response = await _apiClient.dio.get('/products');
    return (response.data as List)
        .map((e) => ProductModel.fromJson(e))
        .toList();
  }

  Future<ProductModel> getById(String id) async {
    final response = await _apiClient.dio.get('/products/$id');
    return ProductModel.fromJson(response.data);
  }
}
