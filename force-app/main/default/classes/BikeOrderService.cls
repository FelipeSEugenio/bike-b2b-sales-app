// Regras de negócio de pedidos de bikes
public with sharing class BikeOrderService {
  // Exceção simples para regras da conversão quote -> pedido
  public class BikeOrderServiceException extends Exception {
  }

  //  Calcula subtotal dos itens

  public static void calculateItemSubtotals(List<Bike_Order_Item__c> items) {
    if (items == null || items.isEmpty())
      return;

    for (Bike_Order_Item__c item : items) {
      if (item.Quantity__c != null && item.Unit_Price__c != null) {
        item.Subtotal__c = item.Quantity__c * item.Unit_Price__c;
      }
    }
  }
  // Atualiza total do pedido
  public static void updateOrderTotal(Set<Id> orderIds) {
    if (orderIds == null || orderIds.isEmpty())
      return;

    Map<Id, Decimal> totals = new Map<Id, Decimal>();

    for (AggregateResult ar : [
      SELECT Bike_Order__c orderId, SUM(Subtotal__c) total
      FROM Bike_Order_Item__c
      WHERE Bike_Order__c IN :orderIds
      GROUP BY Bike_Order__c
    ]) {
      totals.put((Id) ar.get('orderId'), (Decimal) ar.get('total'));
    }

    List<Bike_Order__c> ordersToUpdate = new List<Bike_Order__c>();

    for (Id orderId : orderIds) {
      Decimal total = totals.containsKey(orderId) ? totals.get(orderId) : 0;

      ordersToUpdate.add(
        new Bike_Order__c(Id = orderId, Total_Amount__c = total)
      );
    }
    if (!ordersToUpdate.isEmpty()) {
      update ordersToUpdate;
    }
  }

  // Converte uma quote em pedido e copia seus itens
  @AuraEnabled
  public static Id convertQuoteToOrder(Id quoteId) {
    if (quoteId == null) {
      throw new BikeOrderServiceException(
        'Quote Id é obrigatório para conversão.'
      );
    }

    // Busca dados principais da quote para montar o pedido
    Bike_Quote__c quote = [
      SELECT Id, Name, Account__c
      FROM Bike_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    if (quote.Account__c == null) {
      throw new BikeOrderServiceException(
        'Quote deve estar vinculada a uma Account.'
      );
    }

    // Busca itens da quote para copiar para itens do pedido
    List<Bike_Quote_Item__c> quoteItems = [
      SELECT Bike__c, Quantity__c, Unit_Price__c
      FROM Bike_Quote_Item__c
      WHERE Bike_Quote__c = :quote.Id
    ];

    if (quoteItems.isEmpty()) {
      throw new BikeOrderServiceException(
        'Quote sem itens não pode ser convertida.'
      );
    }

    // Cria pedido base usando a conta da quote
    Bike_Order__c order = new Bike_Order__c(
      Name = 'Order from ' + quote.Name,
      Customer_Account__c = quote.Account__c,
      Status__c = 'Draft',
      Order_Date__c = Date.today()
    );
    insert order;

    // Copia cada item da quote para item de pedido
    List<Bike_Order_Item__c> orderItems = new List<Bike_Order_Item__c>();
    for (Bike_Quote_Item__c quoteItem : quoteItems) {
      orderItems.add(
        new Bike_Order_Item__c(
          Bike_Order__c = order.Id,
          Bike__c = quoteItem.Bike__c,
          Quantity__c = quoteItem.Quantity__c,
          Unit_Price__c = quoteItem.Unit_Price__c
        )
      );
    }
    insert orderItems;

    // Retorna Id do pedido criado para uso futuro na UI/API
    return order.Id;
  }
}
