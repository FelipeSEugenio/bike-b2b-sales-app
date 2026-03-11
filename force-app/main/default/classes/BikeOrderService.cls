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
      SELECT Id, Name, Account__c, Converted_Order__c
      FROM Bike_Quote__c
      WHERE Id = :quoteId
      LIMIT 1
    ];

    // Bloqueia conversão repetida da mesma quote
    if (quote.Converted_Order__c != null) {
      throw new BikeOrderServiceException(
        'Esta quote já foi convertida para o pedido ' +
          quote.Converted_Order__c +
          '.'
      );
    }

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

    // Soma quantidade pedida por bike para validar estoque corretamente
    Map<Id, Decimal> requestedQtyByBike = new Map<Id, Decimal>();
    for (Bike_Quote_Item__c quoteItem : quoteItems) {
      if (quoteItem.Bike__c == null) {
        throw new BikeOrderServiceException(
          'Item da quote sem bike não pode ser convertido.'
        );
      }

      Decimal requestedQty = quoteItem.Quantity__c == null
        ? 0
        : quoteItem.Quantity__c;
      Decimal currentQty = requestedQtyByBike.containsKey(quoteItem.Bike__c)
        ? requestedQtyByBike.get(quoteItem.Bike__c)
        : 0;

      requestedQtyByBike.put(quoteItem.Bike__c, currentQty + requestedQty);
    }

    // Carrega bikes envolvidas para validar e atualizar estoque
    Map<Id, Bike__c> bikesById = new Map<Id, Bike__c>(
      [
        SELECT Id, Name, Stock_Quantity__c, Stock_Status__c
        FROM Bike__c
        WHERE Id IN :requestedQtyByBike.keySet()
        FOR UPDATE
      ]
    );

    List<Bike__c> bikesToUpdate = new List<Bike__c>();

    // Valida se há estoque suficiente para todos os itens da quote
    for (Id bikeId : requestedQtyByBike.keySet()) {
      Bike__c bike = bikesById.get(bikeId);
      if (bike == null) {
        throw new BikeOrderServiceException(
          'Bike do item da quote não encontrada.'
        );
      }

      Decimal availableQty = bike.Stock_Quantity__c == null
        ? 0
        : bike.Stock_Quantity__c;
      Decimal requestedQty = requestedQtyByBike.get(bikeId);

      if (availableQty < requestedQty) {
        throw new BikeOrderServiceException(
          'Estoque insuficiente para a bike ' + bike.Name + '.'
        );
      }

      // Aplica baixa de estoque da bike após validação
      bike.Stock_Quantity__c = availableQty - requestedQty;
      bikesToUpdate.add(bike);
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

    // Recalcula status de estoque e salva bikes com quantidade atualizada
    BikeService.applyStockStatus(bikesToUpdate);
    update bikesToUpdate;

    // Salva referência do pedido criado na quote para evitar duplicidade
    quote.Converted_Order__c = order.Id;
    update quote;

    // Retorna Id do pedido criado para uso futuro na UI/API
    return order.Id;
  }
}
