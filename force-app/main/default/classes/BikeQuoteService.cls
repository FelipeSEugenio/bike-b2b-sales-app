public with sharing class BikeQuoteService {
  // Valida defaults e valores básicos dos itens da quote
  public static void validateQuoteItems(List<Bike_Quote_Item__c> items) {
    if (items == null || items.isEmpty())
      return;

    for (Bike_Quote_Item__c item : items) {
      if (item.Quantity__c == null) {
        item.Quantity__c = 1;
      }

      if (item.Quantity__c <= 0) {
        item.addError('Quantity must be greater than zero.');
      }

      if (item.Unit_Price__c == null) {
        item.Unit_Price__c = 0;
      }

      if (item.Unit_Price__c < 0) {
        item.addError('Unit price cannot be negative.');
      }
    }
  }

  // Calcula subtotal dos itens de quote
  public static void calculateItemSubtotals(List<Bike_Quote_Item__c> items) {
    if (items == null || items.isEmpty())
      return;

    for (Bike_Quote_Item__c item : items) {
      if (item.Quantity__c != null && item.Unit_Price__c != null) {
        item.Subtotal__c = item.Quantity__c * item.Unit_Price__c;
      }
    }
  }

  // Recalcula total da quote usando todos os itens relacionados
  public static void updateQuoteTotal(Set<Id> quoteIds) {
    if (quoteIds == null || quoteIds.isEmpty())
      return;

    Map<Id, Decimal> totalsByQuote = new Map<Id, Decimal>();

    for (AggregateResult ar : [
      SELECT Bike_Quote__c quoteId, SUM(Subtotal__c) total
      FROM Bike_Quote_Item__c
      WHERE Bike_Quote__c IN :quoteIds
      GROUP BY Bike_Quote__c
    ]) {
      totalsByQuote.put((Id) ar.get('quoteId'), (Decimal) ar.get('total'));
    }

    List<Bike_Quote__c> quotesToUpdate = new List<Bike_Quote__c>();

    for (Id quoteId : quoteIds) {
      Decimal total = totalsByQuote.containsKey(quoteId)
        ? totalsByQuote.get(quoteId)
        : 0;
      quotesToUpdate.add(
        new Bike_Quote__c(Id = quoteId, Total_Amount__c = total)
      );
    }

    if (!quotesToUpdate.isEmpty()) {
      update quotesToUpdate;
    }
  }
}
