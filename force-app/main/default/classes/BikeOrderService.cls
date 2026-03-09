// Regras de negócio de pedidos de bikes
public with sharing class BikeOrderService {

    
    //  Calcula subtotal dos itens
     
    public static void calculateItemSubtotals(List<Bike_Order_Item__c> items) {

        if (items == null || items.isEmpty()) return;

        for (Bike_Order_Item__c item : items) {

            if (item.Quantity__c != null && item.Unit_Price__c != null) {
                item.Subtotal__c = item.Quantity__c * item.Unit_Price__c;
            }

        }
    }   
    // Atualiza total do pedido 
    public static void updateOrderTotal(Set<Id> orderIds) {

        if (orderIds == null || orderIds.isEmpty()) return;

        Map<Id, Decimal> totals = new Map<Id, Decimal>();

        for (AggregateResult ar : [
            SELECT Bike_Order__c orderId,
                   SUM(Subtotal__c) total
            FROM Bike_Order_Item__c
            WHERE Bike_Order__c IN :orderIds
            GROUP BY Bike_Order__c
        ]) {
            totals.put(
                (Id) ar.get('orderId'),
                (Decimal) ar.get('total')
            );
        }

        List<Bike_Order__c> ordersToUpdate = new List<Bike_Order__c>();

        for (Id orderId : orderIds) {

            Decimal total = totals.containsKey(orderId)
                ? totals.get(orderId)
                : 0;

            ordersToUpdate.add(
                new Bike_Order__c(
                    Id = orderId,
                    Total_Amount__c = total
                )
            );
        }
        if (!ordersToUpdate.isEmpty()) {
            update ordersToUpdate;
        }
    }
}