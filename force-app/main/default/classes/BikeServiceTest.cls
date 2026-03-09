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
}