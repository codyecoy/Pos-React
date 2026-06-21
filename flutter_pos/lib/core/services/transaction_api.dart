import 'package:dio/dio.dart';

class TransactionApi {
  final Dio dio;

  TransactionApi(this.dio);

  Future<List<dynamic>> getAll() async {
    final response = await dio.get('/transactions');
    return response.data as List;
  }

  Future<dynamic> create(Map<String, dynamic> data) async {
    final response = await dio.post('/transactions', data: data);
    return response.data;
  }
}
