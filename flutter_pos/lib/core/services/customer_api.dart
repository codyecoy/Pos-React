import 'package:dio/dio.dart';

class CustomerApi {
  final Dio dio;

  CustomerApi(this.dio);

  Future<List<dynamic>> getAll() async {
    final response = await dio.get('/customers');
    return response.data as List;
  }
}
