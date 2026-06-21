import 'package:dio/dio.dart';

class ProductApi {
  final Dio dio;

  ProductApi(this.dio);

  Future<List<dynamic>> getAll() async {
    final response = await dio.get('/products');
    return response.data as List;
  }

  Future<List<dynamic>> getMasterProducts(String segment) async {
    final response = await dio.get('/master/products?segment=$segment');
    return response.data as List;
  }

  Future<dynamic> getById(String id) async {
    final response = await dio.get('/products/$id');
    return response.data;
  }

  Future<dynamic> create(Map<String, dynamic> data) async {
    final response = await dio.post('/products', data: data);
    return response.data;
  }

  Future<dynamic> update(String id, Map<String, dynamic> data) async {
    final response = await dio.put('/products/$id', data: data);
    return response.data;
  }

  Future<dynamic> delete(String id) async {
    final response = await dio.delete('/products/$id');
    return response.data;
  }
}
