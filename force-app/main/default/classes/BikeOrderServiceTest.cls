@IsTest
private class BikeOrderServiceTest {
  //  Testa cálculo automático do total do pedido
  @IsTest
  static void deveCalcularTotalDoPedido() {
    // Cria bike para usar no pedido
    Bike__c bike = new Bike__c(
      Name = 'Bike Teste',
      SKU__c = 'TEST-01',
      Price__c = 100,
      Bike_Type__c = 'Hybrid',
      Status__c = 'Active'
    );
    insert bike;
    // Cria pedido
    Bike_Order__c order = new Bike_Order__c(
      Name = 'Pedido Teste',
      Status__c = 'Draft',
      Order_Date__c = Date.today()
    );
    insert order;
    // Cria item do pedido
    Bike_Order_Item__c item = new Bike_Order_Item__c(
      Bike_Order__c = order.Id,
      Bike__c = bike.Id,
      Quantity__c = 2,
      Unit_Price__c = 100
    );
    // Executa trigger e service
    Test.startTest();
    insert item;
    Test.stopTest();
    // Consulta pedido atualizado
    order = [
      SELECT Total_Amount__c
      FROM Bike_Order__c
      WHERE Id = :order.Id
    ];
    // Valida cálculo do total
    System.assertEquals(200, order.Total_Amount__c);
  }

  // Valida conversão de quote em pedido com cópia dos itens
  @IsTest
  static void deveConverterQuoteEmPedido() {
    // Cria conta cliente da quote/pedido
    Account acc = new Account(Name = 'Conta Conversao');
    insert acc;

    // Cria bike para ser usada nos itens
    Bike__c bike = new Bike__c(
      Name = 'Bike Conversao',
      SKU__c = 'CONV-01',
      Price__c = 300,
      Bike_Type__c = 'Hybrid',
      Status__c = 'Active',
      Stock_Quantity__c = 20
    );
    insert bike;

    // Cria quote com vínculo na conta
    Bike_Quote__c quote = new Bike_Quote__c(
      Name = 'Quote Conversao',
      Account__c = acc.Id,
      Status__c = 'Draft'
    );
    insert quote;

    // Cria dois itens da quote
    insert new List<Bike_Quote_Item__c>{
      new Bike_Quote_Item__c(
        Bike_Quote__c = quote.Id,
        Bike__c = bike.Id,
        Quantity__c = 2,
        Unit_Price__c = 300
      ),
      new Bike_Quote_Item__c(
        Bike_Quote__c = quote.Id,
        Bike__c = bike.Id,
        Quantity__c = 1,
        Unit_Price__c = 250
      )
    };

    // Executa conversão
    Test.startTest();
    Id orderId = BikeOrderService.convertQuoteToOrder(quote.Id);
    Test.stopTest();

    // Valida pedido criado
    Bike_Order__c createdOrder = [
      SELECT Id, Customer_Account__c, Total_Amount__c
      FROM Bike_Order__c
      WHERE Id = :orderId
      LIMIT 1
    ];
    System.assertEquals(acc.Id, createdOrder.Customer_Account__c);
    System.assertEquals(850, createdOrder.Total_Amount__c);

    // Valida cópia dos itens
    Integer itemCount = [
      SELECT COUNT()
      FROM Bike_Order_Item__c
      WHERE Bike_Order__c = :orderId
    ];
    System.assertEquals(2, itemCount);
  }
}
