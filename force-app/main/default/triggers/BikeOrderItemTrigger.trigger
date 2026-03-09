//  Trigger dos itens do pedido
//  Calcula subtotal e atualiza total do pedido
 
trigger BikeOrderItemTrigger on Bike_Order_Item__c (
    before insert, before update,
    after insert, after update, after delete, after undelete
) {

    // BEFORE: calcula subtotal
    if (Trigger.isBefore) {
        BikeOrderService.calculateItemSubtotals(Trigger.new);
    }

    // AFTER: recalcula total do pedido
    if (Trigger.isAfter) {

        Set<Id> orderIds = new Set<Id>();

        if (Trigger.isDelete) {
            for (Bike_Order_Item__c item : Trigger.old) {
                if (item.Bike_Order__c != null) orderIds.add(item.Bike_Order__c);
            }
        } else {
            for (Bike_Order_Item__c item : Trigger.new) {
                if (item.Bike_Order__c != null) orderIds.add(item.Bike_Order__c);
            }
        }
        BikeOrderService.updateOrderTotal(orderIds);
    }
}