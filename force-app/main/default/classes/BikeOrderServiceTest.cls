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
}