@IsTest
private class BikeQuoteServiceTest {
  // Valida subtotal do item e total da quote no insert
  @IsTest
  static void shouldCalculateQuoteItemSubtotalAndTotal() {
    Bike_Quote__c quote = new Bike_Quote__c(
      Name = 'Quote Test 1',
      Status__c = 'Draft',
      Valid_Until__c = Date.today().addDays(15)
    );
    insert quote;

    Bike_Quote_Item__c item = new Bike_Quote_Item__c(
      Bike_Quote__c = quote.Id,
      Quantity__c = 3,
      Unit_Price__c = 450
    );

    Test.startTest();
    insert item;
    Test.stopTest();

    item = [
      SELECT Subtotal__c
      FROM Bike_Quote_Item__c
      WHERE Id = :item.Id
    ];
    quote = [
      SELECT Total_Amount__c
      FROM Bike_Quote__c
      WHERE Id = :quote.Id
    ];

    System.assertEquals(1350, item.Subtotal__c);
    System.assertEquals(1350, quote.Total_Amount__c);
  }

  // Valida recálculo do total após exclusão de item
  @IsTest
  static void shouldRecalculateQuoteTotalOnDelete() {
    Bike_Quote__c quote = new Bike_Quote__c(
      Name = 'Quote Test 2',
      Status__c = 'Draft'
    );
    insert quote;

    Bike_Quote_Item__c item1 = new Bike_Quote_Item__c(
      Bike_Quote__c = quote.Id,
      Quantity__c = 2,
      Unit_Price__c = 100
    );
    Bike_Quote_Item__c item2 = new Bike_Quote_Item__c(
      Bike_Quote__c = quote.Id,
      Quantity__c = 1,
      Unit_Price__c = 50
    );

    insert new List<Bike_Quote_Item__c>{ item1, item2 };

    Test.startTest();
    delete item2;
    Test.stopTest();

    quote = [
      SELECT Total_Amount__c
      FROM Bike_Quote__c
      WHERE Id = :quote.Id
    ];

    System.assertEquals(200, quote.Total_Amount__c);
  }

  // Garante default de status no objeto de quote
  @IsTest
  static void shouldUseDraftAsDefaultStatus() {
    Bike_Quote__c quote = new Bike_Quote__c(Name = 'Quote Default Status');

    insert quote;

    quote = [
      SELECT Status__c
      FROM Bike_Quote__c
      WHERE Id = :quote.Id
    ];

    System.assertEquals('Draft', quote.Status__c);
  }

  // Garante quantidade padrão quando valor não é informado
  @IsTest
  static void shouldApplyQuantityDefaultWhenMissing() {
    Bike_Quote__c quote = new Bike_Quote__c(Name = 'Quote Default Quantity');
    insert quote;

    Bike_Quote_Item__c item = new Bike_Quote_Item__c(
      Bike_Quote__c = quote.Id,
      Unit_Price__c = 99
    );

    insert item;

    item = [
      SELECT Quantity__c, Subtotal__c
      FROM Bike_Quote_Item__c
      WHERE Id = :item.Id
    ];

    System.assertEquals(1, item.Quantity__c);
    System.assertEquals(99, item.Subtotal__c);
  }

  // Impede salvar item com quantidade inválida e preço negativo
  @IsTest
  static void shouldBlockInvalidQuantityAndNegativeUnitPrice() {
    Bike_Quote__c quote = new Bike_Quote__c(Name = 'Quote Invalid Item');
    insert quote;

    Bike_Quote_Item__c invalidItem = new Bike_Quote_Item__c(
      Bike_Quote__c = quote.Id,
      Quantity__c = 0,
      Unit_Price__c = -10
    );

    try {
      insert invalidItem;
      System.assert(false, 'Insert should fail for invalid quote item values.');
    } catch (DmlException e) {
      System.assert(
        e.getMessage().contains('Quantity must be greater than zero.')
      );
      System.assert(e.getMessage().contains('Unit price cannot be negative.'));
    }
  }
}
