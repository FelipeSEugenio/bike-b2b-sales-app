// Trigger de itens da quote
// Calcula subtotal e atualiza total da quote
trigger BikeQuoteItemTrigger on Bike_Quote_Item__c(
  before insert,
  before update,
  after insert,
  after update,
  after delete,
  after undelete
) {
  // BEFORE: valida e calcula subtotal do item
  if (Trigger.isBefore) {
    BikeQuoteService.validateQuoteItems(Trigger.new);
    BikeQuoteService.calculateItemSubtotals(Trigger.new);
  }

  // AFTER: recalcula total da quote
  if (Trigger.isAfter) {
    Set<Id> quoteIds = new Set<Id>();

    // Em delete usa Trigger.old para recuperar quote relacionada
    if (Trigger.isDelete) {
      for (Bike_Quote_Item__c item : Trigger.old) {
        if (item.Bike_Quote__c != null) {
          quoteIds.add(item.Bike_Quote__c);
        }
      }
    } else {
      // Nos demais eventos usa Trigger.new
      for (Bike_Quote_Item__c item : Trigger.new) {
        if (item.Bike_Quote__c != null) {
          quoteIds.add(item.Bike_Quote__c);
        }
      }

      // Em update inclui quote antiga para cobrir troca de relacionamento
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
