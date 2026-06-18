import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:json_annotation/json_annotation.dart';

part 'transaction_model.freezed.dart';
part 'transaction_model.g.dart';

@freezed
class CartItemModel with _$CartItemModel {
  const factory CartItemModel({
    required String id,
    required String name,
    required double price,
    required double costPrice,
    required int stock,
    required String category,
    required String image,
    required String barcode,
    required String sku,
    required int quantity,
    required double discount,
    String? note,
  }) = _CartItemModel;

  factory CartItemModel.fromJson(Map<String, dynamic> json) =>
      _$CartItemModelFromJson(json);
}

@freezed
class TransactionModel with _$TransactionModel {
  const factory TransactionModel({
    required String id,
    required List<CartItemModel> items,
    required double subtotal,
    required double tax,
    required double discountTotal,
    required double total,
    required String paymentMethod,
    required double amountPaid,
    required double change,
    required DateTime timestamp,
    required String cashierId,
    String? customerId,
    required String status,
  }) = _TransactionModel;

  factory TransactionModel.fromJson(Map<String, dynamic> json) =>
      _$TransactionModelFromJson(json);
}
