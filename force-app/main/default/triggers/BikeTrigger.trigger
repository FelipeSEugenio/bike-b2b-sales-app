//  Trigger do objeto Bike
//  Chama regras de negócio da BikeService

trigger BikeTrigger on Bike__c(before insert, before update) {
  if (Trigger.isBefore) {
    if (Trigger.isInsert || Trigger.isUpdate) {
      BikeService.validateBikes(Trigger.new);
      BikeService.applyStockStatus(Trigger.new);
    }
  }
}
