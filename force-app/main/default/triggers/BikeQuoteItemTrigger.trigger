trigger BikeQuoteItemTrigger on Bike_Quote_Item__c(
  before insert,
  before update,
  after insert,
  after update,
  after delete,
  after undelete
) {
  if (Trigger.isBefore) {
    BikeQuoteService.validateQuoteItems(Trigger.new);
    BikeQuoteService.calculateItemSubtotals(Trigger.new);
  }

  if (Trigger.isAfter) {
    Set<Id> quoteIds = new Set<Id>();

    if (Trigger.isDelete) {
      for (Bike_Quote_Item__c item : Trigger.old) {
        if (item.Bike_Quote__c != null) {
          quoteIds.add(item.Bike_Quote__c);
        }
      }
    } else {
      for (Bike_Quote_Item__c item : Trigger.new) {
        if (item.Bike_Quote__c != null) {
          quoteIds.add(item.Bike_Quote__c);
        }
      }

      if (Trigger.isUpdate) {
        for (Bike_Quote_Item__c oldItem : Trigger.old) {
          if (oldItem.Bike_Quote__c != null) {
            quoteIds.add(oldItem.Bike_Quote__c);
          }
        }
      }
    }

    BikeQuoteService.updateQuoteTotal(quoteIds);
  }
}
