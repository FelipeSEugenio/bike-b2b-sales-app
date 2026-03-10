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

    // Valida referência do pedido salvo na quote convertida
    quote = [
      SELECT Converted_Order__c
      FROM Bike_Quote__c
      WHERE Id = :quote.Id
      LIMIT 1
    ];
    System.assertEquals(orderId, quote.Converted_Order__c);

    // Valida cópia dos itens
    Integer itemCount = [
      SELECT COUNT()
      FROM Bike_Order_Item__c
      WHERE Bike_Order__c = :orderId
    ];
    System.assertEquals(2, itemCount);

    // Valida baixa de estoque após conversão (20 - 3 = 17)
    bike = [
      SELECT Stock_Quantity__c, Stock_Status__c
      FROM Bike__c
      WHERE Id = :bike.Id
      LIMIT 1
    ];
    System.assertEquals(17, bike.Stock_Quantity__c);
    System.assertEquals('In Stock', bike.Stock_Status__c);
  }

  // Impede conversão quando alguma bike não possui estoque suficiente
  @IsTest
  static void deveBloquearConversaoQuandoEstoqueForInsuficiente() {
    Account acc = new Account(Name = 'Conta Sem Estoque');
    insert acc;

    Bike__c bike = new Bike__c(
      Name = 'Bike Sem Estoque',
      SKU__c = 'CONV-SEM-ESTOQUE',
      Price__c = 200,
      Bike_Type__c = 'Road',
      Status__c = 'Active',
      Stock_Quantity__c = 1
    );
    insert bike;

    Bike_Quote__c quote = new Bike_Quote__c(
      Name = 'Quote Sem Estoque',
      Account__c = acc.Id,
      Status__c = 'Draft'
    );
    insert quote;

    insert new Bike_Quote_Item__c(
      Bike_Quote__c = quote.Id,
      Bike__c = bike.Id,
      Quantity__c = 2,
      Unit_Price__c = 200
    );

    Test.startTest();
    try {
      BikeOrderService.convertQuoteToOrder(quote.Id);
      System.assert(
        false,
        'Conversão deveria falhar por estoque insuficiente.'
      );
    } catch (Exception e) {
      System.assert(e.getMessage().contains('Estoque insuficiente'));
    }
    Test.stopTest();

    // Garante que pedido não foi criado
    Integer orderCount = [
      SELECT COUNT()
      FROM Bike_Order__c
      WHERE Customer_Account__c = :acc.Id
    ];
    System.assertEquals(0, orderCount);

    // Garante que estoque da bike permaneceu inalterado
    bike = [
      SELECT Stock_Quantity__c, Stock_Status__c
      FROM Bike__c
      WHERE Id = :bike.Id
      LIMIT 1
    ];
    System.assertEquals(1, bike.Stock_Quantity__c);
    System.assertEquals('Low Stock', bike.Stock_Status__c);
  }

  // Impede converter a mesma quote mais de uma vez
  @IsTest
  static void deveBloquearConversaoDuplicadaDaMesmaQuote() {
    Account acc = new Account(Name = 'Conta Conversao Duplicada');
    insert acc;

    Bike__c bike = new Bike__c(
      Name = 'Bike Conversao Duplicada',
      SKU__c = 'CONV-DUP-01',
      Price__c = 500,
      Bike_Type__c = 'Mountain',
      Status__c = 'Active',
      Stock_Quantity__c = 5
    );
    insert bike;

    Bike_Quote__c quote = new Bike_Quote__c(
      Name = 'Quote Conversao Duplicada',
      Account__c = acc.Id,
      Status__c = 'Draft'
    );
    insert quote;

    insert new Bike_Quote_Item__c(
      Bike_Quote__c = quote.Id,
      Bike__c = bike.Id,
      Quantity__c = 1,
      Unit_Price__c = 500
    );

    Test.startTest();
    Id firstOrderId = BikeOrderService.convertQuoteToOrder(quote.Id);

    try {
      BikeOrderService.convertQuoteToOrder(quote.Id);
      System.assert(false, 'Segunda conversão deveria falhar.');
    } catch (Exception e) {
      System.assert(e.getMessage().contains('já foi convertida'));
    }
    Test.stopTest();

    // Garante que apenas um pedido foi criado a partir da quote
    Integer orderCount = [
      SELECT COUNT()
      FROM Bike_Order__c
      WHERE Customer_Account__c = :acc.Id
    ];
    System.assertEquals(1, orderCount);

    // Garante que referência na quote aponta para o primeiro pedido
    quote = [
      SELECT Converted_Order__c
      FROM Bike_Quote__c
      WHERE Id = :quote.Id
      LIMIT 1
    ];
    System.assertEquals(firstOrderId, quote.Converted_Order__c);
  }
}
