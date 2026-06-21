import 'package:dio/dio.dart';

class CategoryApi {
  final Dio dio;

  CategoryApi(this.dio);

  Future<List<dynamic>> getAll() async {
    final response = await dio.get('/categories');
    return response.data as List;
  }
}
