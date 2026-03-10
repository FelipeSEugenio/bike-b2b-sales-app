@IsTest
private class BikeServiceTest {
  @IsTest
  static void deveListarBikesAtivas() {
    // Arrange
    insert new Bike__c(
      Name = 'Bike A',
      SKU__c = 'SKU-A',
      Price__c = 1000,
      Bike_Type__c = 'Hybrid',
      Status__c = 'Active'
    );

    insert new Bike__c(
      Name = 'Bike B',
      SKU__c = 'SKU-B',
      Price__c = 900,
      Bike_Type__c = 'Road',
      Status__c = 'Draft'
    );

    // Act
    Test.startTest();
    List<Bike__c> result = BikeService.listActiveBikes(50);
    Test.stopTest();

    // Assert
    System.assertEquals(1, result.size(), 'Deve retornar apenas bikes ativas');
    System.assertEquals('SKU-A', result[0].SKU__c);
  }

  @IsTest
  static void deveBloquearPrecoInvalidoNoTrigger() {
    // Arrange
    Bike__c b = new Bike__c(
      Name = 'Bike Erro',
      SKU__c = 'SKU-ERRO',
      Price__c = 0,
      Bike_Type__c = 'Hybrid',
      Status__c = 'Active'
    );

    // Act + Assert
    Test.startTest();
    try {
      insert b;
      System.assert(false, 'Era para falhar por Price inválido');
    } catch (DmlException e) {
      System.assert(e.getMessage().contains('Price deve ser maior que zero.'));
    }
    Test.stopTest();
  }

  @IsTest
  static void deveCalcularStatusDeEstoqueNoTrigger() {
    Bike__c semEstoque = new Bike__c(
      Name = 'Bike Sem Estoque',
      SKU__c = 'SKU-STOCK-0',
      Price__c = 1200,
      Bike_Type__c = 'Hybrid',
      Status__c = 'Active',
      Stock_Quantity__c = 0
    );

    Bike__c estoqueBaixo = new Bike__c(
      Name = 'Bike Estoque Baixo',
      SKU__c = 'SKU-STOCK-5',
      Price__c = 1400,
      Bike_Type__c = 'Road',
      Status__c = 'Active',
      Stock_Quantity__c = 5
    );

    Bike__c emEstoque = new Bike__c(
      Name = 'Bike Em Estoque',
      SKU__c = 'SKU-STOCK-20',
      Price__c = 1800,
      Bike_Type__c = 'Mountain',
      Status__c = 'Active',
      Stock_Quantity__c = 20
    );

    Test.startTest();
    insert new List<Bike__c>{ semEstoque, estoqueBaixo, emEstoque };
    Test.stopTest();

    Map<String, Bike__c> bikesPorSku = new Map<String, Bike__c>();
    for (Bike__c b : [
      SELECT SKU__c, Stock_Status__c
      FROM Bike__c
      WHERE SKU__c IN ('SKU-STOCK-0', 'SKU-STOCK-5', 'SKU-STOCK-20')
    ]) {
      bikesPorSku.put(b.SKU__c, b);
    }

    System.assertEquals(
      'Out of Stock',
      bikesPorSku.get('SKU-STOCK-0').Stock_Status__c
    );
    System.assertEquals(
      'Low Stock',
      bikesPorSku.get('SKU-STOCK-5').Stock_Status__c
    );
    System.assertEquals(
      'In Stock',
      bikesPorSku.get('SKU-STOCK-20').Stock_Status__c
    );
  }
}
