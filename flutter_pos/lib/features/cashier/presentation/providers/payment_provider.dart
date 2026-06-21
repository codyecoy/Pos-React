import 'package:flutter_riverpod/flutter_riverpod.dart';

enum PaymentMethod {
  cash,
  qris,
  debit,
  creditCard,
  bankTransfer,
  eWallet,
}

class PaymentState {
  final double totalAmount;
  final double paymentAmount;
  final PaymentMethod paymentMethod;

  const PaymentState({
    required this.totalAmount,
    required this.paymentAmount,
    required this.paymentMethod,
  });

  bool get hasEnoughPayment => paymentAmount >= totalAmount;
  double get changeAmount => paymentAmount - totalAmount;

  PaymentState copyWith({
    double? totalAmount,
    double? paymentAmount,
    PaymentMethod? paymentMethod,
  }) {
    return PaymentState(
      totalAmount: totalAmount ?? this.totalAmount,
      paymentAmount: paymentAmount ?? this.paymentAmount,
      paymentMethod: paymentMethod ?? this.paymentMethod,
    );
  }
}

class PaymentNotifier extends StateNotifier<PaymentState> {
  PaymentNotifier()
      : super(const PaymentState(
          totalAmount: 0,
          paymentAmount: 0,
          paymentMethod: PaymentMethod.cash,
        ));

  void initialize(double totalAmount) {
    state = PaymentState(
      totalAmount: totalAmount,
      paymentAmount: 0,
      paymentMethod: PaymentMethod.cash,
    );
  }

  void setPaymentMethod(PaymentMethod method) {
    state = state.copyWith(paymentMethod: method);
  }

  void addQuickAmount(double amount) {
    if (state.paymentAmount <= 0) {
      state = state.copyWith(paymentAmount: amount);
    } else {
      state = state.copyWith(paymentAmount: state.paymentAmount + amount);
    }
  }

  void addShortcutAmount(double amount) {
    state = state.copyWith(paymentAmount: state.paymentAmount + amount);
  }

  void appendDigit(int digit) {
    final current = state.paymentAmount.toInt();
    final next = current * 10 + digit;
    state = state.copyWith(paymentAmount: next.toDouble());
  }

  void removeLastDigit() {
    final current = state.paymentAmount.toInt();
    final next = current ~/ 10;
    state = state.copyWith(paymentAmount: next.toDouble());
  }

  void clearAmount() {
    state = state.copyWith(paymentAmount: 0);
  }

  void setExactTotal() {
    state = state.copyWith(paymentAmount: state.totalAmount);
  }

  void setAmount(double amount) {
    state = state.copyWith(paymentAmount: amount);
  }

  void roundUp() {
    final rounded = ((state.paymentAmount / 1000).ceil() * 1000).toDouble();
    final minimum = ((state.totalAmount / 1000).ceil() * 1000).toDouble();
    state = state.copyWith(paymentAmount: rounded < minimum ? minimum : rounded);
  }

  void reset() {
    state = state.copyWith(paymentAmount: 0, paymentMethod: PaymentMethod.cash);
  }
}

final paymentProvider = StateNotifierProvider<PaymentNotifier, PaymentState>(
  (ref) => PaymentNotifier(),
);
