import 'package:dio/dio.dart';
import 'package:flutter_pos/core/services/api_client.dart';
import 'package:flutter_pos/features/transactions/data/models/transaction_model.dart';

class TransactionApi {
  final ApiClient _apiClient;

  TransactionApi(this._apiClient);

  Future<List<TransactionModel>> getAll() async {
    final response = await _apiClient.dio.get('/transactions');
    return (response.data as List)
        .map((e) => TransactionModel.fromJson(e))
        .toList();
  }

  Future<TransactionModel> create(Map<String, dynamic> data) async {
    final response = await _apiClient.dio.post('/transactions', data: data);
    return TransactionModel.fromJson(response.data);
  }
}
