import 'package:dio/dio.dart';
import 'package:flutter_pos/core/services/api_client.dart';
import 'package:flutter_pos/features/customers/data/models/customer_model.dart';

class CustomerApi {
  final ApiClient _apiClient;

  CustomerApi(this._apiClient);

  Future<List<CustomerModel>> getAll() async {
    final response = await _apiClient.dio.get('/customers');
    return (response.data as List)
        .map((e) => CustomerModel.fromJson(e))
        .toList();
  }
}
